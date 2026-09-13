/**
 * VoiceLearn Africa — Reproducible Multi-Model Benchmark CLI.
 *
 * Models evaluated:
 *   1. Model A: Intron Sahara v2.5 (sahara) — Remote WebSocket API
 *   2. Model B: OpenAI Whisper Tiny (whisper-tiny) — Local, filesystem-only (Apache-2.0)
 *   3. Model C: Meta Wav2Vec2 Base 960h (wav2vec2-base-960h) — Local, filesystem-only baseline (Apache-2.0)
 *
 * ZERO PAID ASR API DEPENDENCIES.
 *
 * Usage:
 *   npm run benchmark
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}

import { runAsrComparison, runIntentAccuracyBaseline } from "../lib/benchmark/runner";
import { BENCHMARK_DATASET } from "../lib/benchmark/dataset/dataset";

async function main() {
  console.log("=================================================================");
  console.log(" VoiceLearn Africa — Three-Model Code-Switch Benchmark Runner");
  console.log(" Sahara v2.5 (Remote) vs. Whisper Tiny (Local) vs. Wav2Vec2 Base 960h (Local)");
  console.log(" ZERO PAID ASR API DEPENDENCIES");
  console.log("=================================================================\n");

  const reportsDir = join(__dirname, "..", "lib", "benchmark", "reports");
  const resultsDir = join(__dirname, "..", "benchmark", "results");
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(resultsDir, { recursive: true });

  console.log(`Loaded ${BENCHMARK_DATASET.length} total dataset records.`);
  const audioCount = BENCHMARK_DATASET.filter((s) => s.audioFilePath && existsSync(s.audioFilePath)).length;
  console.log(`Audio recordings present on disk: ${audioCount}`);
  console.log("Models: [1] Intron Sahara v2.5  [2] OpenAI Whisper Tiny  [3] Meta Wav2Vec2 Base 960h\n");

  console.log("=== Part 1: Speech-to-Text & Downstream Learning Evaluation ===");
  const asr = await runAsrComparison(["sahara", "whisper-tiny", "wav2vec2-base-960h"]);

  for (const summary of asr.summaries) {
    console.log(
      `  • ${summary.providerName} (${summary.model}) [${summary.runtime}]: ` +
      `audioOnDisk=${summary.audioSamplesAvailable}/${summary.totalDatasetSamples} ` +
      `| measured=${summary.samplesMeasured} | status=${summary.statusLabel}`
    );
    if (summary.samplesMeasured > 0) {
      console.log(
        `    -> WER: ${(summary.meanWer! * 100).toFixed(1)}% | ` +
        `CER: ${(summary.meanCer! * 100).toFixed(1)}% | ` +
        `CS-WER: ${summary.codeSwitchWer !== null ? (summary.codeSwitchWer * 100).toFixed(1) + "%" : "N/A"} | ` +
        `Speech-to-Learning Success: ${(summary.speechToLearningSuccessRate! * 100).toFixed(1)}% | ` +
        `Latency: ${summary.meanLatencyMs!.toFixed(0)}ms`
      );
    }
  }

  console.log("\n=== Part 2: Downstream Educational Intent & Topic Baseline (Ground Truth) ===");
  const intent = runIntentAccuracyBaseline();
  console.log(
    `  Concept Accuracy: ${(intent.summary.accuracy * 100).toFixed(1)}% (${intent.summary.correct}/${intent.summary.totalSamples})`
  );
  console.log(
    `  Topic Accuracy:   ${(intent.summary.topicAccuracy * 100).toFixed(1)}% (${intent.summary.correct}/${intent.summary.totalSamples})`
  );

  // Write JSON artifacts
  writeFileSync(join(reportsDir, "asr-comparison-latest.json"), JSON.stringify(asr, null, 2));
  writeFileSync(join(reportsDir, "intent-baseline-latest.json"), JSON.stringify(intent, null, 2));
  writeFileSync(join(resultsDir, "raw-results.json"), JSON.stringify(asr.perSample, null, 2));
  writeFileSync(join(resultsDir, "summary.json"), JSON.stringify({
    metadata: asr.metadata,
    summaries: asr.summaries,
    intentBaseline: intent.summary,
  }, null, 2));

  const evaluationDate = new Date().toISOString().slice(0, 10);
  const reportMd = `# VoiceLearn Africa — Three-Model Code-Switching Speech Benchmark Report
**Generated:** ${evaluationDate}  
**Dataset:** ${BENCHMARK_DATASET.length} curriculum samples (${audioCount} audio files evaluated)  
**Run ID:** \`${asr.metadata.runId}\`

---

## 1. Multi-Model Speech Recognition Comparison

| Model | Runtime | Audio Samples | Evaluated | WER | CER | Code-Switch WER | Speech-to-Learning Success | Warm Latency | Status |
|---|---|---|---|---|---|---|---|---|---|
${asr.summaries
  .map((s) => {
    const wer = s.meanWer !== null ? `${(s.meanWer * 100).toFixed(1)}%` : "—";
    const cer = s.meanCer !== null ? `${(s.meanCer * 100).toFixed(1)}%` : "—";
    const cswer = s.codeSwitchWer !== null ? `${(s.codeSwitchWer * 100).toFixed(1)}%` : "—";
    const s2l = s.speechToLearningSuccessRate !== null ? `${(s.speechToLearningSuccessRate * 100).toFixed(1)}%` : "—";
    const lat = s.meanLatencyMs !== null ? `${s.meanLatencyMs.toFixed(0)}ms` : "—";
    return `| **${s.providerName}** | \`${s.runtime}\` | ${s.audioSamplesAvailable}/${s.totalDatasetSamples} | ${s.samplesMeasured} | ${wer} | ${cer} | ${cswer} | ${s2l} | ${lat} | \`${s.statusLabel}\` |`;
  })
  .join("\n")}

---

## 2. Downstream Agentic Learning Pipeline (Ground Truth Baseline)

- **Total Initial Turns:** ${intent.summary.totalSamples}
- **Concept Entity Extraction Accuracy:** ${(intent.summary.accuracy * 100).toFixed(1)}% (${intent.summary.correct}/${intent.summary.totalSamples})
- **Curriculum Topic Match Accuracy:** ${(intent.summary.topicAccuracy * 100).toFixed(1)}%

---

## 3. Fair Comparison Notice

Sahara is evaluated as the challenge-specific speech model via remote API. Whisper Tiny and Wav2Vec2 Base 960h are independently executed local, filesystem-only baselines under Apache-2.0 licenses, chosen for constrained-hardware benchmarking. Wav2Vec2 Base 960h is an English/LibriSpeech baseline, not an African-language specialist. All models receive the exact same normalized audio (16kHz mono PCM16, SHA-256 verified) and are evaluated against identical human-reviewed reference transcripts.
`;

  writeFileSync(join(reportsDir, "benchmark-report.md"), reportMd);
  writeFileSync(join(reportsDir, "SUMMARY-latest.md"), reportMd);

  console.log(`\nSaved benchmark artifacts to:`);
  console.log(`  - ${join(resultsDir, "raw-results.json")}`);
  console.log(`  - ${join(resultsDir, "summary.json")}`);
  console.log(`  - ${join(reportsDir, "benchmark-report.md")}`);
}

main().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});
