import { existsSync, readFileSync } from "node:fs";
import { BENCHMARK_DATASET } from "./dataset/dataset";
import { speechProviders } from "../speech/registry";
import { SpeechProviderError } from "../speech/types";
import { wordErrorRate, characterErrorRate, codeSwitchPreservation, lexicalOverlapProxy } from "./metrics";
import { extractIntent } from "../tutor/intent";

export interface AsrSampleResult {
  sampleId: string;
  providerName: string;
  status: "measured" | "requires_api_access" | "local_device_test_required" | "audio_dataset_required" | "error";
  wer: number | null;
  cer: number | null;
  codeSwitchPreservation: number | null;
  lexicalOverlap: number | null;
  latencyMs: number | null;
  errorMessage?: string;
}

export interface AsrProviderSummary {
  providerName: string;
  isLive: boolean;
  totalDatasetSamples: number;
  audioSamplesAvailable: number;
  samplesAttempted: number;
  samplesMeasured: number;
  samplesSkipped: number;
  skippedReason: string;
  statusLabel: string;
  meanWer: number | null;
  meanCer: number | null;
  meanCodeSwitchPreservation: number | null;
  meanLatencyMs: number | null;
}

/**
 * Attempts to run every provider in `providerNames` against every audio
 * sample in the dataset. Since this dataset has NO audio (see
 * dataset/types.ts), and no live provider credentials exist in this
 * environment, every result will honestly come back
 * "requires_api_access" — that is the correct, truthful output, not a
 * bug. Once real audio + credentials exist, this exact function
 * produces real measured WER/CER/latency without any code changes.
 */
export async function runAsrComparison(
  providerNames: string[] = Object.keys(speechProviders),
): Promise<{ perSample: AsrSampleResult[]; summaries: AsrProviderSummary[] }> {
  const perSample: AsrSampleResult[] = [];

  for (const providerName of providerNames) {
    const provider = speechProviders[providerName];
    if (!provider) continue;

    for (const sample of BENCHMARK_DATASET) {
      let audioBytes: ArrayBuffer | null = null;
      let mimeType = "audio/webm";

      if (sample.audioFilePath && existsSync(sample.audioFilePath)) {
        const fileBuffer = readFileSync(sample.audioFilePath);
        audioBytes = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
        mimeType = sample.audioFilePath.endsWith(".wav") ? "audio/wav" : "audio/webm";
      }

      if (!audioBytes) {
        // If the provider has live credentials, the bottleneck is real human audio recording
        const status = provider.isLive ? "audio_dataset_required" : "requires_api_access";
        perSample.push({
          sampleId: sample.id,
          providerName,
          status,
          wer: null,
          cer: null,
          codeSwitchPreservation: null,
          lexicalOverlap: null,
          latencyMs: null,
          errorMessage: provider.isLive
            ? "No physical audio recording on disk for this sample (AUDIO_DATASET_REQUIRED)."
            : `Provider ${providerName} is not configured (REQUIRES_API_ACCESS).`,
        });
        continue;
      }

      try {
        const result = await provider.transcribe({
          audioBytes,
          mimeType,
          languagePair: sample.languagePair,
        });
        perSample.push({
          sampleId: sample.id,
          providerName,
          status: "measured",
          wer: wordErrorRate(sample.referenceTranscript, result.transcript),
          cer: characterErrorRate(sample.referenceTranscript, result.transcript),
          codeSwitchPreservation: codeSwitchPreservation(sample.referenceTranscript, result.transcript),
          lexicalOverlap: lexicalOverlapProxy(sample.referenceTranscript, result.transcript),
          latencyMs: result.latencyMs,
        });
      } catch (err) {
        const isConfigError = err instanceof SpeechProviderError && err.code === "REQUIRES_API_ACCESS";
        const isAudioMissing = err instanceof SpeechProviderError && err.code === "EMPTY_AUDIO";
        perSample.push({
          sampleId: sample.id,
          providerName,
          status: isConfigError ? "requires_api_access" : isAudioMissing ? "local_device_test_required" : "error",
          wer: null,
          cer: null,
          codeSwitchPreservation: null,
          lexicalOverlap: null,
          latencyMs: null,
          errorMessage: (err as Error).message,
        });
      }
    }
  }

  const summaries: AsrProviderSummary[] = providerNames
    .filter((name) => speechProviders[name])
    .map((providerName) => {
      const rows = perSample.filter((r) => r.providerName === providerName);
      const measured = rows.filter((r) => r.status === "measured");
      const isLive = speechProviders[providerName].isLive;
      const audioAvailableCount = rows.filter((r) => {
        const s = BENCHMARK_DATASET.find((d) => d.id === r.sampleId);
        return Boolean(s?.audioFilePath && existsSync(s.audioFilePath));
      }).length;
      const skippedCount = rows.length - measured.length;
      const skippedReason = isLive
        ? (audioAvailableCount === 0
            ? "Physical audio recordings not present on disk (AUDIO_DATASET_REQUIRED)"
            : "Some audio samples could not be processed")
        : `Provider ${providerName} is not configured (REQUIRES_API_ACCESS)`;
      const statusLabel = isLive
        ? (measured.length > 0 ? "MEASURED" : "LIVE_AUTHENTICATED (AUDIO_DATASET_REQUIRED)")
        : "BLOCKED (REQUIRES_API_ACCESS)";

      const mean = (values: (number | null)[]) => {
        const nums = values.filter((v): v is number => v !== null);
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      };
      return {
        providerName,
        isLive,
        totalDatasetSamples: rows.length,
        audioSamplesAvailable: audioAvailableCount,
        samplesAttempted: audioAvailableCount,
        samplesMeasured: measured.length,
        samplesSkipped: skippedCount,
        skippedReason,
        statusLabel,
        meanWer: mean(measured.map((r) => r.wer)),
        meanCer: mean(measured.map((r) => r.cer)),
        meanCodeSwitchPreservation: mean(measured.map((r) => r.codeSwitchPreservation)),
        meanLatencyMs: mean(measured.map((r) => r.latencyMs)),
      };
    });

  return { perSample, summaries };
}

export interface IntentBaselineResult {
  sampleId: string;
  expectedConceptId: string | null;
  predictedConceptId: string | null;
  correct: boolean;
}

export interface IntentBaselineSummary {
  totalSamples: number;
  correct: number;
  accuracy: number;
}

/**
 * Ground-truth-transcript baseline for the educational understanding
 * pipeline: runs the tutor's real `extractIntent` module directly over
 * the dataset's authored reference transcripts (i.e. "if ASR were
 * perfect, how accurately does the downstream reasoning identify the
 * right concept?"). This is genuinely computed now — it does not
 * require Sahara or any live speech provider, because it deliberately
 * skips ASR to isolate and test the reasoning layer on its own.
 */
export function runIntentAccuracyBaseline(): {
  perSample: IntentBaselineResult[];
  summary: IntentBaselineSummary;
} {
  // Only "initial_question" samples carry topic-identifying content.
  // "follow_up_answer" samples (e.g. "Twelve.") are bare answers with
  // no topic of their own — including them here would understate
  // accuracy for a reason that has nothing to do with intent
  // extraction quality. They're exercised instead by the assessment
  // module tests (__tests__/assessment.test.ts).
  const scoredSamples = BENCHMARK_DATASET.filter((s) => s.role === "initial_question");
  const perSample: IntentBaselineResult[] = scoredSamples.map((sample) => {
    const { matchedConcept } = extractIntent(sample.referenceTranscript);
    const predictedConceptId = matchedConcept ? matchedConcept.id : null;
    return {
      sampleId: sample.id,
      expectedConceptId: sample.expectedConceptId,
      predictedConceptId,
      correct: predictedConceptId === sample.expectedConceptId,
    };
  });
  const correct = perSample.filter((r) => r.correct).length;
  return {
    perSample,
    summary: {
      totalSamples: perSample.length,
      correct,
      accuracy: perSample.length > 0 ? correct / perSample.length : 0,
    },
  };
}
