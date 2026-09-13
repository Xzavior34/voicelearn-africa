/**
 * VoiceLearn Africa — Reproducible Benchmark CLI.
 *
 * Usage:
 *   npm run benchmark
 *   npm run benchmark:all
 *
 * Evaluates the 3 speech models on the African Code-Switching dataset,
 * measures WER, CER, Code-Switch Preservation, and Downstream Tutoring Performance,
 * and saves machine-readable JSON + human-readable Markdown reports.
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
  console.log("=================================================================\n");

  const reportsDir = join(__dirname, "..", "lib", "benchmark", "reports");
  const resultsDir = join(__dirname, "..", "benchmark", "results");
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(resultsDir, { recursive: true });

  console.log(`Loaded ${BENCHMARK_DATASET.length} dataset samples.`);
  console.log("Models evaluated: Intron Sahara v2.5, OpenAI Whisper Large v3, Google Gemini Audio\n");

  console.log("=== Part 1: Speech-to-Text Multi-Model Evaluation ===");
  const asr = await runAsrComparison(["sahara", "whisper-large-v3", "gemini"]);

  for (const summary of asr.summaries) {
    console.log(
      `  • ${summary.providerName} (${summary.model}): ` +
      `live=${summary.isLive} | audioOnDisk=${summary.audioSamplesAvailable}/${summary.totalDatasetSamples} ` +
      `| measured=${summary.samplesMeasured} | status=${summary.statusLabel}`
    );
    if (summary.samplesMeasured > 0) {
      console.log(
        `    -> Mean WER: ${(summary.meanWer! * 100).toFixed(1)}% | ` +
        `CER: ${(summary.meanCer! * 100).toFixed(1)}% | ` +
        `Tutor Success: ${(summary.tutorSuccessRate! * 100).toFixed(1)}% | ` +
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
  const reportMd = `# VoiceLearn Africa — Code-Switching Speech & Downstream Benchmark Report
**Generated:** ${evaluationDate}  
**Dataset:** ${BENCHMARK_DATASET.length} samples (Standard English, Nigerian Pidgin, Code-Switched English-Pidgin, Code-Switched English-Yoruba)  
**Run ID:** \`${asr.metadata.runId}\`

---

## 1. Multi-Model Speech Recognition Comparison

| Speech Engine | Model ID | Live | Audio Available | Evaluated | Mean WER | Mean CER | Code-Switch Preservation | Tutor Success | Median Latency | Status |
|---|---|---|---|---|---|---|---|---|---|---|
${asr.summaries
  .map((s) => {
    const wer = s.meanWer !== null ? `${(s.meanWer * 100).toFixed(1)}%` : "—";
    const cer = s.meanCer !== null ? `${(s.meanCer * 100).toFixed(1)}%` : "—";
    const csp = s.meanCodeSwitchPreservation !== null ? `${(s.meanCodeSwitchPreservation * 100).toFixed(1)}%` : "—";
    const tutor = s.tutorSuccessRate !== null ? `${(s.tutorSuccessRate * 100).toFixed(1)}%` : "—";
    const lat = s.meanLatencyMs !== null ? `${s.meanLatencyMs.toFixed(0)}ms` : "—";
    return `| **${s.providerName}** | \`${s.model}\` | ${s.isLive ? "✅ Yes" : "❌ No"} | ${s.audioSamplesAvailable}/${s.totalDatasetSamples} | ${s.samplesMeasured} | ${wer} | ${cer} | ${csp} | ${tutor} | ${lat} | \`${s.statusLabel}\` |`;
  })
  .join("\n")}

---

## 2. Linguistic Tier Breakdown

| Category | Description | Dataset Samples |
|---|---|---|
| **Tier 1: Standard English** | Monolingual formal English baseline across mathematics, science, English, physics, and chemistry. | 6 |
| **Tier 2: Nigerian Pidgin** | Monolingual Nigerian Pidgin educational phrasing. | 6 |
| **Tier 3: English <-> Nigerian Pidgin** | Real classroom code-switching mixing subject vocabulary with Pidgin connective phrases. | 14 |
| **Tier 4: English <-> Yoruba** | Classroom code-switching mixing Yoruba grammar with English subject vocabulary. | 6 |
| **Follow-up Answers** | Learner responses to follow-up questions for downstream assessment verification. | 2 |

---

## 3. Downstream Educational Reasoning Baseline (No ASR)

- **Concept Identification Accuracy:** **${(intent.summary.accuracy * 100).toFixed(1)}%** (${intent.summary.correct}/${intent.summary.totalSamples} initial question samples)
- **Subject / Topic Classification Accuracy:** **${(intent.summary.topicAccuracy * 100).toFixed(1)}%**
- **Evaluation Purpose:** Isolates the tutor reasoning pipeline from speech recognition, establishing the performance ceiling when transcription is 100% accurate.

---

## 4. Reproducibility & Auditing

Every metric in this report is deterministic and verifiable locally:
\`\`\`bash
npm test                  # 100% automated test suite
npm run benchmark:health  # Test provider API connectivity
npm run benchmark:all     # Run full 3-model benchmark
\`\`\`
`;

  writeFileSync(join(reportsDir, "SUMMARY-latest.md"), reportMd);
  writeFileSync(join(resultsDir, "benchmark-report.md"), reportMd);

  console.log(`\n✅ Reports generated successfully in:`);
  console.log(`   - ${reportsDir}`);
  console.log(`   - ${resultsDir}`);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
