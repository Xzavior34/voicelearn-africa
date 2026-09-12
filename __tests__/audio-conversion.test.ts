import { describe, it, expect, beforeAll } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { convertToPcm16Mono16k, chunkPcm16, AudioConversionError } from "@/lib/speech/audio-conversion";

const hasFfmpeg = (() => {
  try {
    const res = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
})();

function generateTestWebm(durationSeconds: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
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
