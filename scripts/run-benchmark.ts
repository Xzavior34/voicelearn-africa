/**
 * VoiceLearn Africa — Reproducible Multi-Model Benchmark CLI.
 *
 * Models evaluated:
 *   1. Model A: Intron Sahara v2.5 (sahara) — Remote WebSocket API — PRODUCTION model
 *   2. Model B: OpenAI Whisper Tiny (whisper-tiny) — Local, filesystem-only (Apache-2.0)
 *   3. Model C: OpenAI Whisper Base (whisper-base) — Local, filesystem-only (Apache-2.0)
 *   4. Model D: Meta Wav2Vec2 Base 960h (wav2vec2-base-960h) — Local, filesystem-only baseline (Apache-2.0)
 *
 * Models B, C, D are benchmark comparators only — never used in production.
 * ZERO PAID ASR API DEPENDENCIES for B/C/D.
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

const CODE_SWITCH_CATEGORIES = ["nigerian_pidgin", "english_pidgin", "english_yoruba", "educational_code_switching"];
const MODELS = ["sahara", "whisper-tiny", "whisper-base", "wav2vec2-base-960h"];

function fmtPct(v: number | null): string {
  return v !== null ? `${(v * 100).toFixed(1)}%` : "N/A";
}
function fmtMs(v: number | null | undefined): string {
  return v !== null && v !== undefined ? `${v.toFixed(0)}ms` : "N/A";
}

async function main() {
  console.log("=================================================================");
  console.log(" VoiceLearn Africa — Four-Model Code-Switch Benchmark Runner");
  console.log(" Sahara v2.5 (Remote) vs. Whisper Tiny vs. Whisper Base vs. Wav2Vec2 Base 960h (all Local)");
  console.log(" ZERO PAID ASR API DEPENDENCIES for the three local comparators");
  console.log("=================================================================\n");

  const reportsDir = join(__dirname, "..", "lib", "benchmark", "reports");
  const resultsDir = join(__dirname, "..", "benchmark", "results");
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(resultsDir, { recursive: true });

  const physicalAudioSamples = BENCHMARK_DATASET.filter((s) => s.audioFilePath && existsSync(s.audioFilePath));
  const physicalCodeSwitchedSamples = physicalAudioSamples.filter((s) => CODE_SWITCH_CATEGORIES.includes(s.category));
  const textOnlyCount = BENCHMARK_DATASET.length - physicalAudioSamples.length;

  console.log(`Loaded ${BENCHMARK_DATASET.length} total dataset records.`);
  console.log(`Physical audio recordings present on disk: ${physicalAudioSamples.length} (${physicalAudioSamples.map((s) => s.id).join(", ") || "none"})`);
  console.log(`Physical CODE-SWITCHED audio recordings: ${physicalCodeSwitchedSamples.length}${physicalCodeSwitchedSamples.length === 0 ? "  <- PENDING HUMAN RECORDING, see DATASET.md" : ""}`);
  console.log(`Text-only fixtures (no audio file): ${textOnlyCount}`);
  console.log("Models: [1] Intron Sahara v2.5  [2] OpenAI Whisper Tiny  [3] OpenAI Whisper Base  [4] Meta Wav2Vec2 Base 960h\n");

  console.log("=== Part 1: Speech-to-Text & Downstream Learning Evaluation ===");
  const asr = await runAsrComparison(MODELS);

  for (const summary of asr.summaries) {
    console.log(
      `  • ${summary.providerName} (${summary.model}) [${summary.runtime}]: ` +
      `audioOnDisk=${summary.audioSamplesAvailable}/${summary.totalDatasetSamples} ` +
      `| measured=${summary.samplesMeasured} | status=${summary.statusLabel}` +
      (summary.statusLabel !== "VERIFIED" ? ` (${summary.skippedReason})` : "")
    );
    if (summary.samplesMeasured > 0) {
      console.log(
        `    -> WER: ${fmtPct(summary.meanWer)} | ` +
        `CER: ${fmtPct(summary.meanCer)} | ` +
        `CS-WER: ${summary.codeSwitchWer !== null ? fmtPct(summary.codeSwitchWer) : "N/A (no code-switched sample measured)"} | ` +
        `Speech-to-Learning Success: ${fmtPct(summary.speechToLearningSuccessRate)} | ` +
        `Latency: ${fmtMs(summary.meanLatencyMs)}`
      );
    }
  }

  console.log("\n=== Part 2: Downstream Educational Intent & Topic Baseline (Ground Truth) ===");
  const intent = runIntentAccuracyBaseline();
  console.log(
    `  Concept Accuracy: ${fmtPct(intent.summary.accuracy)} (${intent.summary.correct}/${intent.summary.totalSamples})`
  );
  console.log(
    `  Topic Accuracy:   ${fmtPct(intent.summary.topicAccuracy)} (${intent.summary.correct}/${intent.summary.totalSamples})`
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

  // Dataset composition breakdowns for the report
  const noiseCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  const accentCounts: Record<string, number> = {};
  const langPairCounts: Record<string, number> = {};
  for (const s of BENCHMARK_DATASET) {
    noiseCounts[s.noiseCondition] = (noiseCounts[s.noiseCondition] || 0) + 1;
    deviceCounts[s.deviceType] = (deviceCounts[s.deviceType] || 0) + 1;
    if (s.speakerCountry) countryCounts[s.speakerCountry] = (countryCounts[s.speakerCountry] || 0) + 1;
    if (s.speakerAccent) accentCounts[s.speakerAccent] = (accentCounts[s.speakerAccent] || 0) + 1;
    langPairCounts[s.languagePair] = (langPairCounts[s.languagePair] || 0) + 1;
  }
  const fmtCounts = (counts: Record<string, number>) =>
    Object.entries(counts).map(([k, v]) => `${k} (${v})`).join(", ") || "none";

  const reportMd = `# VoiceLearn Africa — Four-Model Code-Switching Speech Benchmark Report
**Generated:** ${evaluationDate}
**Run ID:** \`${asr.metadata.runId}\`

---

## 1. Dataset

- **Total records:** ${BENCHMARK_DATASET.length}
- **Physical audio recordings:** ${physicalAudioSamples.length} (${physicalAudioSamples.map((s) => s.id).join(", ") || "none"})
- **Physical CODE-SWITCHED audio recordings:** ${physicalCodeSwitchedSamples.length}${physicalCodeSwitchedSamples.length === 0 ? " — **PENDING HUMAN RECORDING**, see DATASET.md Section 4. Do not treat any text fixture below as audio evidence." : ""}
- **Text-only functional fixtures (no audio file):** ${textOnlyCount}
- **Audio format (where present):** PCM16 mono WAV
- **Language pairs:** ${fmtCounts(langPairCounts)}
- **Noise conditions:** ${fmtCounts(noiseCounts)}
- **Device types:** ${fmtCounts(deviceCounts)}
- **Speaker country:** ${fmtCounts(countryCounts)}
- **Speaker accent:** ${fmtCounts(accentCounts)}

**Physical audio benchmark** (the numbers below) covers only the ${physicalAudioSamples.length} sample(s) listed above. **Text-only functional fixtures** are used solely for the Part 2 ground-truth intent/topic baseline — they are never a substitute for measured ASR accuracy on real speech.

---

## 2. Multi-Model Speech Recognition Comparison

Only physical audio samples are eligible for measurement below. Cells show "N/A" where a metric genuinely was not measured — never a fabricated or assumed value.

| Model | Physical Samples | WER | CER | CS-WER | Latency | Learning Success | Status |
|---|---|---|---|---|---|---|---|
${asr.summaries
  .map((s) => {
    const wer = s.meanWer !== null ? fmtPct(s.meanWer) : "N/A";
    const cer = s.meanCer !== null ? fmtPct(s.meanCer) : "N/A";
    const cswer = s.codeSwitchWer !== null ? fmtPct(s.codeSwitchWer) : "N/A";
    const s2l = s.speechToLearningSuccessRate !== null ? fmtPct(s.speechToLearningSuccessRate) : "N/A";
    const lat = fmtMs(s.meanLatencyMs);
    return `| **${s.providerName}** | ${s.samplesMeasured}/${s.audioSamplesAvailable} | ${wer} | ${cer} | ${cswer} | ${lat} | ${s2l} | \`${s.statusLabel}\` |`;
  })
  .join("\n")}

Status meanings: \`VERIFIED\` = at least one real measurement on physical audio. \`BLOCKED (MODEL_NOT_FOUND)\` = local model files incomplete/absent. \`BLOCKED (REQUIRES_API_ACCESS)\` = remote API key not configured. \`BLOCKED_RUNTIME\` = physical audio and model files exist, but the inference runtime itself failed (e.g. Python/PyTorch unavailable on this device). \`FAILED\` = an unexpected error occurred while measuring. \`CONFIGURED_NOT_MEASURED\` = model reports ready and audio exists, but no attempt has completed yet. \`AUDIO_DATASET_REQUIRED\` = reserved for when the dataset has zero physical audio at all — not used while ${physicalAudioSamples.length > 0 ? "physical audio exists" : "the dataset is genuinely empty of audio"}.

---

## 3. Downstream Agentic Learning Pipeline (Ground Truth Baseline)

- **Total Initial Turns:** ${intent.summary.totalSamples}
- **Concept Entity Extraction Accuracy:** ${fmtPct(intent.summary.accuracy)} (${intent.summary.correct}/${intent.summary.totalSamples})
- **Curriculum Topic Match Accuracy:** ${fmtPct(intent.summary.topicAccuracy)}

This baseline uses ground-truth (human-authored) transcripts to isolate downstream reasoning accuracy from ASR accuracy — it answers "if speech recognition were perfect, how good is the educational reasoning?" It is not a substitute for Section 2's real ASR measurement.

---

## 4. Fair Comparison Notice

Sahara is evaluated as the challenge-specific, production speech model. Whisper Tiny, Whisper Base, and Wav2Vec2 Base 960h are independently executed local, filesystem-only benchmark comparators under Apache-2.0 licenses — none of them are ever used in the production learner-facing app. Wav2Vec2 Base 960h is an English/LibriSpeech baseline, not an African-language specialist. All models receive the exact same normalized audio and are evaluated against identical human-reviewed reference transcripts. No model is tuned per-recording.

---

## 5. Limitations

- The physical audio dataset currently has **${physicalAudioSamples.length} recording(s)**. Do not draw population-level conclusions from this sample size — treat any measured WER/CER here as a single-sample case study, not a statistically powered claim.
- **Zero physical code-switched audio recordings exist as of this report.** Code-switching behavior is currently evidenced only through text-only fixtures and the tutor's topic/intent handling — not through measured ASR accuracy on genuine code-switched speech.
- Historical benchmark numbers referenced elsewhere in this repository's documentation may not match this run — always prefer the numbers in this file and \`benchmark/results/summary.json\` over older prose claims.
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
