import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { BENCHMARK_DATASET } from "./dataset/dataset";
import { speechProviders } from "../speech/registry";
import { SpeechProviderError } from "../speech/types";
import {
  wordErrorRate,
  characterErrorRate,
  exactMatch,
  codeSwitchPreservation,
  lexicalOverlapProxy,
  evaluateDownstreamTutor,
  DownstreamTutorEval,
} from "./metrics";
import { extractIntent } from "../tutor/intent";

export interface AsrSampleResult {
  sampleId: string;
  provider: string;
  providerName: string;
  model: string;
  runtime: "remote-api" | "local";
  status:
    | "measured"
    | "requires_api_access"
    | "model_not_found"
    | "local_device_test_required"
    | "audio_dataset_required"
    | "error";
  referenceTranscript: string;
  hypothesisTranscript: string | null;
  languagePair: string;
  domain: string;
  category: string;
  wer: number | null;
  cer: number | null;
  exactMatch: boolean | null;
  codeSwitchPreservation: number | null;
  lexicalOverlap: number | null;
  latencyMs: number | null;
  warmInferenceLatencyMs?: number | null;
  coldStartMs?: number | null;
  device?: string | null;
  downstream: DownstreamTutorEval | null;
  audioHash?: string | null;
  errorMessage?: string;
}

export interface CategoryPerformance {
  category: string;
  sampleCount: number;
  meanWer: number | null;
  meanCer: number | null;
  tutorSuccessRate: number | null;
}

export interface AsrProviderSummary {
  provider: string;
  providerName: string;
  model: string;
  runtime: "remote-api" | "local";
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
  codeSwitchWer: number | null;
  exactMatchRate: number | null;
  meanCodeSwitchPreservation: number | null;
  meanLexicalOverlap: number | null;
  speechToLearningSuccessRate: number | null;
  tutorSuccessRate: number | null;
  intentAccuracy: number | null;
  topicAccuracy: number | null;
  meanLatencyMs: number | null;
  meanWarmInferenceMs: number | null;
  device?: string | null;
  failureRate: number;
  categories: Record<string, CategoryPerformance>;
}

export interface BenchmarkRunMetadata {
  runId: string;
  timestamp: string;
  datasetVersion: string;
  datasetSampleCount: number;
  models: string[];
}

export interface BenchmarkRunOutput {
  metadata: BenchmarkRunMetadata;
  perSample: AsrSampleResult[];
  summaries: AsrProviderSummary[];
}

function computeAudioHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function runAsrComparison(
  providerNames: string[] = ["sahara", "whisper-tiny", "wav2vec2-base-960h"],
): Promise<BenchmarkRunOutput> {
  const perSample: AsrSampleResult[] = [];
  const runId = `run-${Date.now()}`;
  const timestamp = new Date().toISOString();

  for (const providerName of providerNames) {
    const provider = speechProviders[providerName];
    if (!provider) continue;

    const modelName = provider.model || providerName;

    for (const sample of BENCHMARK_DATASET) {
      let audioBytes: ArrayBuffer | null = null;
      let mimeType = "audio/wav";
      let audioHash: string | null = null;

      if (sample.audioFilePath && existsSync(sample.audioFilePath)) {
        const fileBuffer = readFileSync(sample.audioFilePath);
        audioBytes = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
        mimeType = sample.audioFilePath.endsWith(".wav") ? "audio/wav" : "audio/webm";
        audioHash = computeAudioHash(fileBuffer);
      }

      if (!audioBytes) {
        // If the provider is genuinely live (credentialed API, or local model
        // files actually present), the bottleneck is real human audio
        // recording. If it isn't live, distinguish WHY: a remote API without
        // credentials is "requires_api_access"; a local model whose weight
        // files are not on disk is "model_not_found" — never presented as a
        // successful measurement either way.
        const status = provider.isLive
          ? "audio_dataset_required"
          : provider.runtime === "local"
            ? "model_not_found"
            : "requires_api_access";
        perSample.push({
          sampleId: sample.id,
          provider: providerName,
          providerName: provider.name || providerName,
          model: modelName,
          runtime: provider.runtime || (providerName === "sahara" ? "remote-api" : "local"),
          status,
          referenceTranscript: sample.referenceTranscript,
          hypothesisTranscript: null,
          languagePair: sample.languagePair,
          domain: sample.domain,
          category: sample.category,
          wer: null,
          cer: null,
          exactMatch: null,
          codeSwitchPreservation: null,
          lexicalOverlap: null,
          latencyMs: null,
          downstream: null,
          audioHash: null,
          errorMessage: provider.isLive
            ? "No physical audio recording on disk for this sample (AUDIO_DATASET_REQUIRED)."
            : provider.runtime === "local"
              ? `Local model files for ${provider.name || providerName} were not found on disk (MODEL_NOT_FOUND). See LOCAL_MODEL_SETUP.md.`
              : `Provider ${provider.name || providerName} is not configured (REQUIRES_API_ACCESS).`,
        });
        continue;
      }

      try {
        const result = await provider.transcribe({
          audioBytes,
          mimeType,
          audioPath: sample.audioFilePath ?? undefined,
          languagePair: sample.languagePair === "pcm" ? "en-pcm" : sample.languagePair,
        });

        const downstream = evaluateDownstreamTutor(sample, result.transcript);

        perSample.push({
          sampleId: sample.id,
          provider: providerName,
          providerName: provider.name || providerName,
          model: result.model || modelName,
          runtime: result.runtime || provider.runtime || (providerName === "sahara" ? "remote-api" : "local"),
          status: "measured",
          referenceTranscript: sample.referenceTranscript,
          hypothesisTranscript: result.transcript,
          languagePair: sample.languagePair,
          domain: sample.domain,
          category: sample.category,
          wer: wordErrorRate(sample.referenceTranscript, result.transcript),
          cer: characterErrorRate(sample.referenceTranscript, result.transcript),
          exactMatch: exactMatch(sample.referenceTranscript, result.transcript),
          codeSwitchPreservation: codeSwitchPreservation(sample.referenceTranscript, result.transcript),
          lexicalOverlap: lexicalOverlapProxy(sample.referenceTranscript, result.transcript),
          latencyMs: result.latencyMs,
          warmInferenceLatencyMs: result.metadata?.warmInferenceLatencyMs ?? result.latencyMs,
          coldStartMs: result.metadata?.coldStartMs ?? null,
          device: result.metadata?.device ?? null,
          downstream,
          audioHash,
        });
      } catch (err) {
        const isConfigError = err instanceof SpeechProviderError && err.code === "REQUIRES_API_ACCESS";
        const isAudioMissing = err instanceof SpeechProviderError && err.code === "EMPTY_AUDIO";
        const isModelMissing = err instanceof SpeechProviderError && err.code === "MODEL_NOT_FOUND";
        perSample.push({
          sampleId: sample.id,
          provider: providerName,
          providerName: provider.name || providerName,
          model: modelName,
          runtime: provider.runtime || (providerName === "sahara" ? "remote-api" : "local"),
          status: isConfigError
            ? "requires_api_access"
            : isModelMissing
              ? "model_not_found"
              : isAudioMissing
                ? "local_device_test_required"
                : "error",
          referenceTranscript: sample.referenceTranscript,
          hypothesisTranscript: null,
          languagePair: sample.languagePair,
          domain: sample.domain,
          category: sample.category,
          wer: null,
          cer: null,
          exactMatch: null,
          codeSwitchPreservation: null,
          lexicalOverlap: null,
          latencyMs: null,
          downstream: null,
          audioHash,
          errorMessage: (err as Error).message,
        });
      }
    }
  }

  const summaries: AsrProviderSummary[] = providerNames
    .filter((name) => speechProviders[name])
    .map((providerName) => {
      const provider = speechProviders[providerName];
      const rows = perSample.filter((r) => r.provider === providerName);
      const measured = rows.filter((r) => r.status === "measured");
      const isLive = provider.isLive;
      const audioAvailableCount = rows.filter((r) => {
        const s = BENCHMARK_DATASET.find((d) => d.id === r.sampleId);
        return Boolean(s?.audioFilePath && existsSync(s.audioFilePath));
      }).length;
      const skippedCount = rows.length - measured.length;
      const skippedReason = isLive
        ? (audioAvailableCount === 0
            ? "Physical audio recordings not present on disk (AUDIO_DATASET_REQUIRED)"
            : "Some audio samples could not be processed")
        : provider.runtime === "local"
          ? `Local model files for ${provider.name || providerName} not found on disk (MODEL_NOT_FOUND). See LOCAL_MODEL_SETUP.md.`
          : `Provider ${provider.name || providerName} is not configured (REQUIRES_API_ACCESS)`;
      const statusLabel = isLive
        ? (measured.length > 0 ? "VERIFIED" : "LIVE_READY (AUDIO_DATASET_REQUIRED)")
        : provider.runtime === "local"
          ? "BLOCKED (MODEL_NOT_FOUND)"
          : "BLOCKED (REQUIRES_API_ACCESS)";

      const mean = (values: (number | null)[]) => {
        const nums = values.filter((v): v is number => v !== null);
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      };

      // Category breakdown
      const categories: Record<string, CategoryPerformance> = {};
      const uniqueCategories = [...new Set(BENCHMARK_DATASET.map((s) => s.category))];
      for (const cat of uniqueCategories) {
        const catRows = measured.filter((r) => r.category === cat);
        const catWer = mean(catRows.map((r) => r.wer));
        const catCer = mean(catRows.map((r) => r.cer));
        const successCount = catRows.filter((r) => r.downstream?.tutorSuccess).length;
        categories[cat] = {
          category: cat,
          sampleCount: catRows.length,
          meanWer: catWer,
          meanCer: catCer,
          tutorSuccessRate: catRows.length > 0 ? successCount / catRows.length : null,
        };
      }

      const csCategories = ["nigerian_pidgin", "english_pidgin", "english_yoruba", "educational_code_switching"];
      const csMeasuredRows = measured.filter((r) => csCategories.includes(r.category));
      const codeSwitchWer = mean(csMeasuredRows.map((r) => r.wer));

      const exactMatchCount = measured.filter((r) => r.exactMatch === true).length;
      const tutorSuccessCount = measured.filter((r) => r.downstream?.tutorSuccess === true).length;
      const intentSuccessCount = measured.filter((r) => r.downstream?.intentMatched === true).length;
      const topicSuccessCount = measured.filter((r) => r.downstream?.topicMatched === true).length;

      const deviceUsed = measured.find((r) => r.device)?.device;

      return {
        provider: providerName,
        providerName: provider.name || providerName,
        model: provider.model || providerName,
        runtime: provider.runtime || (providerName === "sahara" ? "remote-api" : "local"),
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
        codeSwitchWer,
        exactMatchRate: measured.length > 0 ? exactMatchCount / measured.length : null,
        meanCodeSwitchPreservation: mean(measured.map((r) => r.codeSwitchPreservation)),
        meanLexicalOverlap: mean(measured.map((r) => r.lexicalOverlap)),
        speechToLearningSuccessRate: measured.length > 0 ? tutorSuccessCount / measured.length : null,
        tutorSuccessRate: measured.length > 0 ? tutorSuccessCount / measured.length : null,
        intentAccuracy: measured.length > 0 ? intentSuccessCount / measured.length : null,
        topicAccuracy: measured.length > 0 ? topicSuccessCount / measured.length : null,
        meanLatencyMs: mean(measured.map((r) => r.latencyMs)),
        meanWarmInferenceMs: mean(measured.map((r) => r.warmInferenceLatencyMs ?? r.latencyMs)),
        device: deviceUsed,
        failureRate: rows.length > 0 ? (rows.length - measured.length) / rows.length : 0,
        categories,
      };
    });

  return {
    metadata: {
      runId,
      timestamp,
      datasetVersion: "dataset-v2-codeswitch-africa",
      datasetSampleCount: BENCHMARK_DATASET.length,
      models: providerNames,
    },
    perSample,
    summaries,
  };
}

export interface IntentBaselineResult {
  sampleId: string;
  referenceTranscript: string;
  languagePair: string;
  expectedConceptId: string | null;
  predictedConceptId: string | null;
  topicMatched: boolean;
  intentMatched: boolean;
  correct: boolean;
}

export interface IntentBaselineSummary {
  totalSamples: number;
  correct: number;
  accuracy: number;
  topicAccuracy: number;
}

export function runIntentAccuracyBaseline(): {
  perSample: IntentBaselineResult[];
  summary: IntentBaselineSummary;
} {
  const scoredSamples = BENCHMARK_DATASET.filter((s) => s.role === "initial_question");
  const perSample: IntentBaselineResult[] = scoredSamples.map((sample) => {
    const { understanding, matchedConcept } = extractIntent(sample.referenceTranscript);
    const predictedConceptId = matchedConcept ? matchedConcept.id : null;
    const correct = predictedConceptId === sample.expectedConceptId;
    const isSubjectMatch = (sSubject: string, cSubject: string) => {
      if (sSubject === cSubject) return true;
      if (cSubject === "science" && ["science", "biology", "physics", "chemistry"].includes(sSubject)) return true;
      return false;
    };

    const topicMatched =
      sample.expectedConceptId === null
        ? predictedConceptId === null
        : matchedConcept !== null && isSubjectMatch(sample.subject, matchedConcept.subject);
    const intentMatched = understanding.learningNeed === sample.intent;

    return {
      sampleId: sample.id,
      referenceTranscript: sample.referenceTranscript,
      languagePair: sample.languagePair,
      expectedConceptId: sample.expectedConceptId,
      predictedConceptId,
      topicMatched,
      intentMatched,
      correct,
    };
  });

  const correct = perSample.filter((r) => r.correct).length;
  const topicCorrect = perSample.filter((r) => r.topicMatched).length;

  return {
    perSample,
    summary: {
      totalSamples: perSample.length,
      correct,
      accuracy: perSample.length > 0 ? correct / perSample.length : 0,
      topicAccuracy: perSample.length > 0 ? topicCorrect / perSample.length : 0,
    },
  };
}
