import { describe, it, expect, beforeAll } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { convertToPcm16Mono16k, chunkPcm16, tryExtractPcm16Mono16kWav, AudioConversionError, checkFfmpegAvailable } from "@/lib/speech/audio-conversion";

const hasFfmpeg = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundled = require("ffmpeg-static") as string | null;
    if (bundled) {
      const res = spawnSync(bundled, ["-version"], { stdio: "ignore" });
      if (res.status === 0) return true;
    }
  } catch {
    // fall through to system PATH check
  }
  try {
    const res = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
})();

function createSyntheticWav(sampleRate: number, numChannels: number, bitsPerSample: number, pcmData: Buffer): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([header, pcmData]);
}

describe("tryExtractPcm16Mono16kWav", () => {
  it("extracts raw PCM samples from a canonical 16kHz 16-bit mono WAV", () => {
    const rawPcm = Buffer.alloc(3200, 42); // 0.1s of audio
    const wav = createSyntheticWav(16000, 1, 16, rawPcm);
    const extracted = tryExtractPcm16Mono16kWav(wav);
    expect(extracted).not.toBeNull();
    expect(extracted?.length).toBe(3200);
    expect(extracted?.[0]).toBe(42);
  });

  it("returns null for non-16kHz WAV audio", () => {
    const rawPcm = Buffer.alloc(8820, 0); // 44.1kHz
    const wav = createSyntheticWav(44100, 1, 16, rawPcm);
    expect(tryExtractPcm16Mono16kWav(wav)).toBeNull();
  });

  it("returns null for stereo WAV audio", () => {
    const rawPcm = Buffer.alloc(6400, 0); // stereo
    const wav = createSyntheticWav(16000, 2, 16, rawPcm);
    expect(tryExtractPcm16Mono16kWav(wav)).toBeNull();
  });

  it("returns null for arbitrary non-WAV bytes", () => {
    expect(tryExtractPcm16Mono16kWav(Buffer.from("not audio at all"))).toBeNull();
  });

  it("convertToPcm16Mono16k resolves directly on 16kHz mono WAV without ffmpeg", async () => {
    const rawPcm = Buffer.alloc(1600, 99);
    const wav = createSyntheticWav(16000, 1, 16, rawPcm);
    const result = await convertToPcm16Mono16k(wav);
    expect(result.length).toBe(1600);
    expect(result[0]).toBe(99);
  });
});

function resolveTestFfmpegPath(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundled = require("ffmpeg-static") as string | null;
    if (bundled) return bundled;
  } catch {
    // fall through to system PATH
  }
  return "ffmpeg";
}

function generateTestWebm(durationSeconds: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(resolveTestFfmpegPath(), [
      "-hide_banner", "-loglevel", "error",
      "-f", "lavfi", "-i", `sine=frequency=440:duration=${durationSeconds}`,
      "-c:a", "libopus", "-f", "webm", "pipe:1",
    ]);
    const chunks: Buffer[] = [];
    ffmpeg.stdout.on("data", (c) => chunks.push(c));
    ffmpeg.on("close", (code) => {
      if (code !== 0) reject(new Error(`ffmpeg exited ${code}`));
      else resolve(Buffer.concat(chunks));
    });
  });
}

describe.skipIf(!hasFfmpeg)("convertToPcm16Mono16k", () => {
  let oneSecondWebm: Buffer;

  beforeAll(async () => {
    if (!hasFfmpeg) return;
    oneSecondWebm = await generateTestWebm(1);
  }, 15_000);

  it("converts a real webm/opus recording into PCM16 mono 16kHz", async () => {
    const pcm = await convertToPcm16Mono16k(oneSecondWebm);
    // 1 second * 16000 samples/sec * 2 bytes/sample (16-bit) * 1 channel
    expect(pcm.length).toBeCloseTo(32000, -2); // within ~100 bytes of exact
  }, 15_000);

  it("REGRESSION: converts webm/opus using the bundled ffmpeg-static binary even with an empty PATH (simulates Vercel, which has no system ffmpeg)", async () => {
    // This is the exact production bug that was previously silent: audio
    // conversion used to shell out to a bare `ffmpeg` resolved from PATH,
    // which does not exist on Vercel's Node serverless runtime. Clearing
    // PATH here proves conversion no longer depends on a system ffmpeg.
    const originalPath = process.env.PATH;
    process.env.PATH = "";
    try {
      const pcm = await convertToPcm16Mono16k(oneSecondWebm);
      expect(pcm.length).toBeCloseTo(32000, -2);
    } finally {
      process.env.PATH = originalPath;
    }
  }, 15_000);

  it("rejects garbage input instead of silently returning empty audio", async () => {
    await expect(convertToPcm16Mono16k(Buffer.from("not audio at all"))).rejects.toBeInstanceOf(
      AudioConversionError,
    );
  });
});

describe("chunkPcm16", () => {
  it("splits audio into chunks within the 1KB-32KB bounds Sahara requires", () => {
    const pcm = Buffer.alloc(100_000, 1);
    const chunks = chunkPcm16(pcm, 8192);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks.slice(0, -1)) {
      expect(chunk.length).toBeGreaterThanOrEqual(1024);
      expect(chunk.length).toBeLessThanOrEqual(32768);
    }
    const totalBytes = chunks.reduce((sum, c) => sum + c.length, 0);
    expect(totalBytes).toBe(pcm.length);
  });

  it("clamps an out-of-range requested chunk size into bounds", () => {
    const pcm = Buffer.alloc(5000, 1);
    const chunks = chunkPcm16(pcm, 999999);
    expect(chunks[0].length).toBeLessThanOrEqual(32768);
  });
});

describe("AudioConversionError.detail", () => {
  it("REGRESSION: never silently drops diagnostic info when stderr is empty (this was a real bug: a spawn-level failure like ENOENT/EACCES/ENOEXEC previously reported empty detail because sahara.ts read err.stderr, but the spawn error handler only ever populated err.message, leaving err.stderr as an empty string)", () => {
    const err = new AudioConversionError("ffmpeg binary not found", "");
    expect(err.detail).toContain("ffmpeg binary not found");
    expect(err.detail).not.toBe("");
  });

  it("includes both message and stderr when both are present", () => {
    const err = new AudioConversionError("ffmpeg exited with code 1", "Unknown decoder 'opus'");
    expect(err.detail).toContain("ffmpeg exited with code 1");
    expect(err.detail).toContain("Unknown decoder 'opus'");
  });

  it("never returns an empty string even with no detail at all", () => {
    const err = new AudioConversionError("", "");
    expect(err.detail.length).toBeGreaterThan(0);
  });
});

describe("checkFfmpegAvailable", () => {
  it("reports whether ffmpeg can actually execute, with platform/arch context for diagnosing production issues", async () => {
    const result = await checkFfmpegAvailable();
    expect(result.platform).toBe(process.platform);
    expect(result.arch).toBe(process.arch);
    expect(typeof result.canExecute).toBe("boolean");
    if (result.canExecute) {
      expect(result.version).toBeTruthy();
      expect(result.error).toBeNull();
    } else {
      expect(result.error).toBeTruthy();
    }
  }, 15_000);
});
