import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Converts arbitrary browser-recorded audio (webm/opus from MediaRecorder,
 * or anything else ffmpeg can decode) into raw PCM16 little-endian, mono,
 * 16kHz. This is exactly what Sahara's streaming contract requires
 * (docs.voice.intron.io: sample_rate 16000, bit_rate 16, num_channels 1).
 *
 * This keeps the existing browser-side recording flow
 * (`lib/client/useSpeechRecorder.ts`, MediaRecorder) completely
 * unchanged. Conversion happens server-side, in `/api/speech`, right
 * before handing audio to the Sahara provider.
 *
 * ROOT CAUSE OF A REAL PRODUCTION BUG (confirmed via GET /api/speech/health
 * in production: canExecute: false, code=ENOENT, resolvedPath: "ffmpeg"):
 * ffmpeg-static's own index.js computes its binary path as
 * path.join(__dirname, "ffmpeg"). Next.js's server bundler (Turbopack)
 * inlines small packages by default and substitutes __dirname with a
 * literal build-time path (verified directly in the compiled output:
 * without the fix below it becomes the literal string
 * "/ROOT/node_modules/ffmpeg-static", a build-container path that does
 * not exist on Vercel's actual runtime filesystem). ffmpeg-static then
 * returns that wrong path, existsSync() correctly rejects it, and the
 * code silently fell back to a bare "ffmpeg" that also does not exist.
 *
 * Fixed two ways:
 * 1. next.config.ts sets serverExternalPackages: ["ffmpeg-static"], which
 *    tells Next.js to leave this package as a genuine runtime require()
 *    against the real node_modules folder instead of inlining it, so
 *    __dirname resolves correctly again. Verified directly: the compiled
 *    output now contains a real external require reference instead of a
 *    baked-in path string.
 * 2. As defense in depth, independent of trusting bundler behavior,
 *    resolveFfmpegPath() below also tries deriving the binary path via
 *    require.resolve("ffmpeg-static/package.json"), which uses Node's
 *    real module resolution rather than the package's own __dirname
 *    computation, and falls back to a bare "ffmpeg" on system PATH only
 *    as a last resort.
 */
function resolveFfmpegPath(): string {
  // Primary: ffmpeg-static's own export. Works correctly now that the
  // package is externalized (see next.config.ts) rather than inlined.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundled = require("ffmpeg-static") as string | null;
    if (bundled && existsSync(bundled)) return bundled;
  } catch {
    // ffmpeg-static not installed/resolvable, fall through
  }

  // Secondary: derive the path ourselves via real module resolution
  // instead of trusting ffmpeg-static's own __dirname-based computation.
  // This still works even if some future bundler change re-inlines the
  // package, as long as require.resolve itself is not rewritten.
  try {
    const pkgJsonPath = require.resolve("ffmpeg-static/package.json");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("ffmpeg-static/package.json") as {
      name: string;
      [key: string]: unknown;
    };
    const meta = pkg[pkg.name] as { "executable-base-name"?: string } | undefined;
    const executableBaseName = meta?.["executable-base-name"] || "ffmpeg";
    const packageDir = pkgJsonPath.replace(/[/\\]package\.json$/, "");
    const suffix = process.platform === "win32" ? ".exe" : "";
    const derivedPath = `${packageDir}/${executableBaseName}${suffix}`;
    if (existsSync(derivedPath)) return derivedPath;
  } catch {
    // require.resolve failed, fall through to system ffmpeg
  }

  return "ffmpeg";
}

export interface FfmpegDiagnostic {
  resolvedPath: string;
  binaryExistsOnDisk: boolean;
  platform: string;
  arch: string;
  nodeVersion: string;
  canExecute: boolean;
  version: string | null;
  error: string | null;
}

/**
 * Actually attempts to run "ffmpeg -version" and reports exactly what
 * happened, distinguishing "binary not found" (ENOENT), "permission
 * denied" (EACCES), "wrong architecture" (ENOEXEC / "Exec format error"),
 * and "ran fine". This exists specifically so a production failure can be
 * diagnosed with one request instead of guessing from a generic error
 * message. Exposed via GET /api/speech/health.
 */
export function checkFfmpegAvailable(): Promise<FfmpegDiagnostic> {
  const resolvedPath = resolveFfmpegPath();
  const base: Omit<FfmpegDiagnostic, "canExecute" | "version" | "error"> = {
    resolvedPath,
    binaryExistsOnDisk: resolvedPath !== "ffmpeg" ? existsSync(resolvedPath) : false,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  };

  return new Promise((resolve) => {
    let settled = false;
    let ffmpeg;
    try {
      ffmpeg = spawn(/*turbopackIgnore: true*/ resolvedPath, ["-version"]);
    } catch (err) {
      resolve({ ...base, canExecute: false, version: null, error: `spawn threw synchronously: ${(err as Error).message}` });
      return;
    }

    const outChunks: Buffer[] = [];
    ffmpeg.stdout?.on("data", (c: Buffer) => outChunks.push(c));

    ffmpeg.on("error", (err: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      resolve({
        ...base,
        canExecute: false,
        version: null,
        error: `code=${err.code ?? "unknown"} errno=${err.errno ?? "unknown"} syscall=${err.syscall ?? "unknown"} message=${err.message}`,
      });
    });

    ffmpeg.on("close", (code) => {
      if (settled) return;
      settled = true;
      const versionLine = Buffer.concat(outChunks).toString("utf-8").split("\n")[0] || null;
      resolve({
        ...base,
        canExecute: code === 0,
        version: code === 0 ? versionLine : null,
        error: code === 0 ? null : `ffmpeg -version exited with code ${code}`,
      });
    });
  });
}

export class AudioConversionError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message);
    this.name = "AudioConversionError";
  }

  /** Combines message and stderr for logging. Never silently drops either. */
  get detail(): string {
    const parts = [this.message, this.stderr].filter((s) => s && s.trim().length > 0);
    return parts.length > 0 ? parts.join(" | stderr: ") : "(no detail captured)";
  }
}

/**
 * Parses a standard RIFF/WAV buffer. If it is already 16kHz, 16-bit, mono PCM,
 * returns the raw PCM bytes directly without requiring external ffmpeg.
 */
export function tryExtractPcm16Mono16kWav(buffer: Buffer): Buffer | null {
  if (buffer.length < 44) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    return null;
  }

  let offset = 12;
  let isPcm16Mono16k = false;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;

    if (chunkId === "fmt ") {
      if (chunkSize < 16 || chunkDataOffset + 16 > buffer.length) return null;
      const audioFormat = buffer.readUInt16LE(chunkDataOffset); // 1 = PCM uncompressed
      const numChannels = buffer.readUInt16LE(chunkDataOffset + 2); // 1 = mono
      const sampleRate = buffer.readUInt32LE(chunkDataOffset + 4); // 16000 Hz
      const bitsPerSample = buffer.readUInt16LE(chunkDataOffset + 14); // 16 bits

      if (audioFormat === 1 && numChannels === 1 && sampleRate === 16000 && bitsPerSample === 16) {
        isPcm16Mono16k = true;
      }
    } else if (chunkId === "data") {
      if (isPcm16Mono16k) {
        const end = Math.min(buffer.length, chunkDataOffset + chunkSize);
        return buffer.subarray(chunkDataOffset, end);
      }
    }

    offset = chunkDataOffset + chunkSize;
    if (chunkSize % 2 !== 0) offset += 1; // RIFF chunk word alignment
  }

  return null;
}

export function convertToPcm16Mono16k(input: Buffer): Promise<Buffer> {
  // If the audio is already a canonical 16kHz 16-bit mono WAV, extract raw PCM
  // without spawning an external process (works in environments without ffmpeg).
  const directPcm = tryExtractPcm16Mono16kWav(input);
  if (directPcm !== null && directPcm.length > 0) {
    return Promise.resolve(directPcm);
  }

  return new Promise((resolve, reject) => {
    const ffmpegPath = resolveFfmpegPath();
    const ffmpeg = spawn(/*turbopackIgnore: true*/ ffmpegPath, [
      "-hide_banner",
      "-loglevel", "error",
      "-i", "pipe:0", // read input from stdin, auto-detect container/codec
      "-f", "s16le", // raw PCM16 little-endian output
      "-acodec", "pcm_s16le",
      "-ar", "16000", // 16kHz sample rate
      "-ac", "1", // mono
      "pipe:1", // write output to stdout
    ]);

    const outChunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    ffmpeg.stdout.on("data", (chunk: Buffer) => outChunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk: Buffer) => errChunks.push(chunk));

    ffmpeg.on("error", (err: NodeJS.ErrnoException) => {
      const isNotFound = err.code === "ENOENT";
      const message = isNotFound
        ? "ffmpeg binary not found (checked ffmpeg-static and system PATH). To transcode compressed audio (e.g. WebM/Opus), ensure the 'ffmpeg-static' dependency installed correctly, or provide uncompressed 16kHz 16-bit mono PCM WAV."
        : `Failed to spawn ffmpeg: ${err.message}`;
      // Capture the raw Node error fields (code/errno/syscall) so a spawn
      // failure (e.g. ENOENT missing binary, EACCES permission denied,
      // ENOEXEC architecture mismatch) is actually visible in production
      // logs instead of being silently dropped. Passed as the AudioConversionError's
      // "stderr" field to preserve the existing constructor shape.
      const diagnostic = `path=${ffmpegPath} code=${err.code ?? "unknown"} errno=${err.errno ?? "unknown"} syscall=${err.syscall ?? "unknown"} platform=${process.platform} arch=${process.arch}`;
      reject(new AudioConversionError(message, diagnostic));
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        reject(
          new AudioConversionError(
            `ffmpeg exited with code ${code}`,
            Buffer.concat(errChunks).toString("utf-8"),
          ),
        );
        return;
      }
      resolve(Buffer.concat(outChunks));
    });

    ffmpeg.stdin.on("error", () => {
      // Ignore EPIPE if ffmpeg exits before we finish writing. The
      // "close" handler above is the source of truth for success/failure.
    });
    ffmpeg.stdin.write(input);
    ffmpeg.stdin.end();
  });
}

/** Splits raw PCM16 bytes into Sahara-compliant chunk sizes (1KB-32KB). */
export function chunkPcm16(pcm: Buffer, chunkSizeBytes = 8192): Buffer[] {
  const MIN = 1024;
  const MAX = 32768;
  const size = Math.max(MIN, Math.min(MAX, chunkSizeBytes));
  const chunks: Buffer[] = [];
  for (let offset = 0; offset < pcm.length; offset += size) {
    chunks.push(pcm.subarray(offset, offset + size));
  }
  return chunks;
}
