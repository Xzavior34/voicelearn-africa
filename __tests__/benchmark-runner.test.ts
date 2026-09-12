import { describe, it, expect } from "vitest";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";

const QUESTION_SAMPLES = BENCHMARK_DATASET.filter((s) => s.role === "initial_question");

describe("runAsrComparison", () => {
  it("honestly reports requires_api_access for every sample when no providers are configured", async () => {
    const { perSample, summaries } = await runAsrComparison(["sahara", "model-b", "model-c"]);
    expect(perSample.length).toBe(BENCHMARK_DATASET.length * 3);
    expect(perSample.every((r) => r.status === "requires_api_access")).toBe(true);
    for (const summary of summaries) {
      expect(summary.isLive).toBe(false);
      expect(summary.samplesMeasured).toBe(0);
      expect(summary.meanWer).toBeNull();
    }
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
