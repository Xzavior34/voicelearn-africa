import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";
import { whisperProvider } from "@/lib/speech/providers/whisper";
import { wav2vec2Provider } from "@/lib/speech/providers/wav2vec2";

const QUESTION_SAMPLES = BENCHMARK_DATASET.filter((s) => s.role === "initial_question");

describe("runAsrComparison", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    delete process.env.SAHARA_API_KEY;
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
    vi.restoreAllMocks();
  });

  it("honestly reports unconfigured state for sahara when no API key is provided", async () => {
    const { perSample, summaries } = await runAsrComparison(["sahara"]);
    expect(perSample.length).toBe(BENCHMARK_DATASET.length);
    const saharaSummary = summaries.find((s) => s.provider === "sahara");
    expect(saharaSummary?.isLive).toBe(false);
    expect(saharaSummary?.statusLabel).toContain("REQUIRES_API_ACCESS");
  });

  it("identifies local open-weight providers as local runtime without paid API keys", async () => {
    vi.spyOn(whisperProvider, "transcribe").mockResolvedValue({
      provider: "whisper-large-v3",
      providerName: "whisper-large-v3",
      model: "openai/whisper-large-v3",
      runtime: "local",
      transcript: "Why negative times negative dey give positive?",
      confidence: null,
      languagePair: "en-pcm",
      latencyMs: 120,
      success: true,
      metadata: { device: "cpu" },
    });

    vi.spyOn(wav2vec2Provider, "transcribe").mockResolvedValue({
      provider: "wav2vec2-large-960h",
      providerName: "wav2vec2-large-960h",
      model: "facebook/wav2vec2-large-960h",
      runtime: "local",
      transcript: "WHY NEGATIVE TIMES NEGATIVE DEY GIVE POSITIVE",
      confidence: null,
      languagePair: "en-pcm",
      latencyMs: 80,
      success: true,
      metadata: { device: "cpu" },
    });

    const { summaries } = await runAsrComparison(["whisper-large-v3", "wav2vec2-large-960h"]);
    const whisperSummary = summaries.find((s) => s.provider === "whisper-large-v3");
    const wav2vecSummary = summaries.find((s) => s.provider === "wav2vec2-large-960h");

    expect(whisperSummary?.runtime).toBe("local");
    expect(wav2vecSummary?.runtime).toBe("local");
    expect(whisperSummary?.isLive).toBe(true);
    expect(wav2vecSummary?.isLive).toBe(true);
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
