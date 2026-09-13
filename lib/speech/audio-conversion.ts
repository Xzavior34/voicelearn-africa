import { spawn } from "node:child_process";

/**
 * Converts arbitrary browser-recorded audio (webm/opus from MediaRecorder,
 * or anything else ffmpeg can decode) into raw PCM16 little-endian, mono,
 * 16kHz — exactly what Sahara's streaming contract requires
 * (docs.voice.intron.io: sample_rate 16000, bit_rate 16, num_channels 1).
 *
 * This keeps the existing browser-side recording flow
 * (`lib/client/useSpeechRecorder.ts`, MediaRecorder) completely
 * unchanged — conversion happens server-side, in `/api/speech`, right
 * before handing audio to the Sahara provider. Requires `ffmpeg` to be
 * present on the host (it is used via a child process, not a network
 * call).
 */
export class AudioConversionError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message);
    this.name = "AudioConversionError";
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
    const ffmpeg = spawn("ffmpeg", [
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
        ? "ffmpeg is not installed on the server host. To transcode compressed audio (e.g. WebM/Opus), install ffmpeg on the host, or provide uncompressed 16kHz 16-bit mono PCM WAV."
        : `Failed to spawn ffmpeg: ${err.message}`;
      reject(new AudioConversionError(message, ""));
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
