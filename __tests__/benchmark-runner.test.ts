import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";
import { whisperProvider } from "@/lib/speech/providers/whisper";
import { wav2vec2Provider } from "@/lib/speech/providers/wav2vec2";
import { SpeechProviderError } from "@/lib/speech/types";

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

  it("reports BLOCKED (MODEL_NOT_FOUND) for local models whose folders are incomplete, never fabricating a result", async () => {
    // In this environment models/whisper-tiny and models/wav2vec2-base-960h
    // only contain model.safetensors (config/tokenizer files are still
    // missing), so isLive is honestly false — no mocking needed.
    const { summaries, perSample } = await runAsrComparison(["whisper-tiny", "wav2vec2-base-960h"]);
    const whisperSummary = summaries.find((s) => s.provider === "whisper-tiny");
    const wav2vecSummary = summaries.find((s) => s.provider === "wav2vec2-base-960h");

    expect(whisperSummary?.runtime).toBe("local");
    expect(wav2vecSummary?.runtime).toBe("local");
    expect(whisperSummary?.isLive).toBe(false);
    expect(wav2vecSummary?.isLive).toBe(false);
    expect(whisperSummary?.statusLabel).toBe("BLOCKED (MODEL_NOT_FOUND)");
    expect(wav2vecSummary?.statusLabel).toBe("BLOCKED (MODEL_NOT_FOUND)");
    expect(whisperSummary?.samplesMeasured).toBe(0);
    expect(wav2vecSummary?.samplesMeasured).toBe(0);

    const whisperRows = perSample.filter((r) => r.provider === "whisper-tiny");
    expect(whisperRows.every((r) => r.status === "model_not_found")).toBe(true);
    expect(whisperRows.every((r) => r.hypothesisTranscript === null)).toBe(true);
    expect(whisperRows.every((r) => r.wer === null)).toBe(true);
  });

  it("identifies local providers as local runtime and reports isLive=true once model files are genuinely complete (mocked)", async () => {
    vi.spyOn(whisperProvider, "isLive", "get").mockReturnValue(true);
    vi.spyOn(whisperProvider, "transcribe").mockResolvedValue({
      provider: "whisper-tiny",
      providerName: "whisper-tiny",
      model: "openai/whisper-tiny",
      runtime: "local",
      transcript: "Why negative times negative dey give positive?",
      confidence: null,
      languagePair: "en-pcm",
      latencyMs: 120,
      success: true,
      metadata: { device: "cpu" },
    });

    vi.spyOn(wav2vec2Provider, "isLive", "get").mockReturnValue(true);
    vi.spyOn(wav2vec2Provider, "transcribe").mockResolvedValue({
      provider: "wav2vec2-base-960h",
      providerName: "wav2vec2-base-960h",
      model: "facebook/wav2vec2-base-960h",
      runtime: "local",
      transcript: "WHY NEGATIVE TIMES NEGATIVE DEY GIVE POSITIVE",
      confidence: null,
      languagePair: "en-pcm",
      latencyMs: 80,
      success: true,
      metadata: { device: "cpu" },
    });

    const { summaries } = await runAsrComparison(["whisper-tiny", "wav2vec2-base-960h"]);
    const whisperSummary = summaries.find((s) => s.provider === "whisper-tiny");
    const wav2vecSummary = summaries.find((s) => s.provider === "wav2vec2-base-960h");

    expect(whisperSummary?.runtime).toBe("local");
    expect(wav2vecSummary?.runtime).toBe("local");
    expect(whisperSummary?.isLive).toBe(true);
    expect(wav2vecSummary?.isLive).toBe(true);
  });

  it("marks a sample model_not_found (never a fabricated measurement) when transcribe throws MODEL_NOT_FOUND", async () => {
    vi.spyOn(whisperProvider, "isLive", "get").mockReturnValue(true);
    vi.spyOn(whisperProvider, "transcribe").mockRejectedValue(
      new SpeechProviderError("whisper-tiny", "MODEL_NOT_FOUND", "Local model directory not found: /fake/path"),
    );

    const { perSample } = await runAsrComparison(["whisper-tiny"]);
    const modelNotFoundRows = perSample.filter((r) => r.provider === "whisper-tiny" && r.status === "model_not_found");
    expect(modelNotFoundRows.length).toBeGreaterThan(0);
    expect(modelNotFoundRows.every((r) => r.hypothesisTranscript === null && r.wer === null)).toBe(true);
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
