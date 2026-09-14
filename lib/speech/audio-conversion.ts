import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Converts arbitrary browser-recorded audio (webm/opus from MediaRecorder,
 * or anything else ffmpeg can decode) into raw PCM16 little-endian, mono,
 * 16kHz — exactly what Sahara's streaming contract requires
 * (docs.voice.intron.io: sample_rate 16000, bit_rate 16, num_channels 1).
 *
 * This keeps the existing browser-side recording flow
 * (`lib/client/useSpeechRecorder.ts`, MediaRecorder) completely
 * unchanged — conversion happens server-side, in `/api/speech`, right
 * before handing audio to the Sahara provider.
 *
 * FIXED (previously a real production bug): this used to shell out to a
 * bare `ffmpeg` on PATH, which does NOT exist on Vercel's default Node
 * serverless runtime (and often not on a fresh Termux/Android install
 * either) — every browser-recorded (webm/opus) submission silently
 * failed with AUDIO_CONVERSION_FAILED, which the UI shows as the generic
 * "I couldn't catch that clearly" message. `ffmpeg-static` bundles a
 * real portable ffmpeg binary as an npm dependency, so it's present in
 * the deployed bundle with no server/host configuration required. We
 * still fall back to a system `ffmpeg` on PATH if `ffmpeg-static` is
 * ever unavailable.
 */
function resolveFfmpegPath(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundled = require("ffmpeg-static") as string | null;
    if (bundled && existsSync(bundled)) return bundled;
  } catch {
    // ffmpeg-static not installed/resolvable — fall through to system ffmpeg
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
      // Ignore EPIPE if ffmpeg exits before we finish writing — the
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
