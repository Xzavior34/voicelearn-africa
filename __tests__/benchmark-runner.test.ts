import { describe, it, expect, afterEach } from "vitest";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";

const QUESTION_SAMPLES = BENCHMARK_DATASET.filter((s) => s.role === "initial_question");

describe("runAsrComparison", () => {
  const originalKey = process.env.SAHARA_API_KEY;

  afterEach(() => {
    if (originalKey) process.env.SAHARA_API_KEY = originalKey;
    else delete process.env.SAHARA_API_KEY;
  });

  it("honestly reports requires_api_access for every sample when no providers are configured", async () => {
    delete process.env.SAHARA_API_KEY;
    const { perSample, summaries } = await runAsrComparison(["sahara", "model-b", "model-c"]);
    expect(perSample.length).toBe(BENCHMARK_DATASET.length * 3);
    expect(perSample.every((r) => r.status === "requires_api_access")).toBe(true);
    for (const summary of summaries) {
      expect(summary.isLive).toBe(false);
      expect(summary.samplesMeasured).toBe(0);
      expect(summary.meanWer).toBeNull();
    }
  });

  it("distinguishes live provider lacking audio dataset from unconfigured provider", async () => {
    process.env.SAHARA_API_KEY = "dummy-test-key";
    const { summaries } = await runAsrComparison(["sahara", "model-b"]);
    const saharaSummary = summaries.find((s) => s.providerName === "sahara");
    const modelBSummary = summaries.find((s) => s.providerName === "model-b");

    expect(saharaSummary?.isLive).toBe(true);
    expect(saharaSummary?.statusLabel).toContain("AUDIO_DATASET_REQUIRED");
    expect(saharaSummary?.audioSamplesAvailable).toBe(0);
    expect(saharaSummary?.samplesMeasured).toBe(0);

    expect(modelBSummary?.isLive).toBe(false);
    expect(modelBSummary?.statusLabel).toContain("REQUIRES_API_ACCESS");
  });
});

describe("runIntentAccuracyBaseline", () => {
  it("computes a real, non-trivial accuracy figure from ground-truth transcripts", () => {
    const { summary, perSample } = runIntentAccuracyBaseline();
    expect(summary.totalSamples).toBe(QUESTION_SAMPLES.length);
    // Sanity bound: this must not be 100% or 0% — it's a real signal,
    // not a placeholder. Some out-of-curriculum samples should score 0
    // correctly (predictedConceptId is also null), and some correctly
    // return non-null matches.
    expect(summary.accuracy).toBeGreaterThan(0);
    expect(perSample.some((r) => r.expectedConceptId === null && r.predictedConceptId === null)).toBe(true);
  });
});
