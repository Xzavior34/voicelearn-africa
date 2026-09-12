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

export function convertToPcm16Mono16k(input: Buffer): Promise<Buffer> {
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

    ffmpeg.on("error", (err) => {
      reject(new AudioConversionError(`Failed to spawn ffmpeg: ${err.message}`, ""));
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
