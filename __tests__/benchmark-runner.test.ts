import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";

const QUESTION_SAMPLES = BENCHMARK_DATASET.filter((s) => s.role === "initial_question");

describe("runAsrComparison", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    delete process.env.SAHARA_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.WHISPER_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("honestly reports unconfigured state when no API keys are provided", async () => {
    const { perSample, summaries } = await runAsrComparison(["sahara", "model-b", "model-c"]);
    expect(perSample.length).toBe(BENCHMARK_DATASET.length * 3);
    for (const summary of summaries) {
      expect(summary.isLive).toBe(false);
      expect(summary.samplesMeasured).toBe(0);
      expect(summary.meanWer).toBeNull();
    }
  });

  it("distinguishes live provider with audio dataset from unconfigured provider", async () => {
    process.env.SAHARA_API_KEY = "dummy-test-key";
    const { summaries } = await runAsrComparison(["sahara", "model-b"]);
    const saharaSummary = summaries.find((s) => s.provider === "sahara" || s.providerName.includes("Sahara"));
    const modelBSummary = summaries.find((s) => s.provider === "model-b" || s.providerName.includes("Whisper") || s.providerName === "model-b");

    expect(saharaSummary?.isLive).toBe(true);
    expect(modelBSummary?.isLive).toBe(false);
    expect(modelBSummary?.statusLabel).toContain("REQUIRES_API_ACCESS");
  });
});

describe("runIntentAccuracyBaseline", () => {
  it("computes a real, non-trivial accuracy figure from ground-truth transcripts", () => {
    const { summary, perSample } = runIntentAccuracyBaseline();
    expect(summary.totalSamples).toBe(QUESTION_SAMPLES.length);
    expect(summary.accuracy).toBeGreaterThan(0);
    expect(perSample.some((r) => r.correct === true)).toBe(true);
  });
});
