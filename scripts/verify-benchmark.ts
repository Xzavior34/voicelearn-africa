/**
 * VoiceLearn Africa — Single-command benchmark verification.
 *
 * Usage: npm run benchmark:verify
 *
 * Runs everything that can be checked without guessing, in order:
 *   1. Environment check           (.env.local / .env loaded, SAHARA_API_KEY presence)
 *   2. Model-path check            (do the two local model directories exist)
 *   3. Model-file check            (are the required files + a weights file present)
 *   4. Sahara connectivity check   (real checkHealth() call, no fabrication)
 *   5. Audio fixture check         (physical audio on disk vs. text-only fixtures)
 *   6. Whisper Tiny smoke test     (real transcribe() call on real audio, only if files present)
 *   7. Wav2Vec2 Base smoke test    (real transcribe() call on real audio, only if files present)
 *   8. Benchmark execution         (the real runAsrComparison(), same as `npm run benchmark`)
 *   9. Result validation           (no measured sample may have a null transcript;
 *                                   a blocked model may not show as measured)
 *  10. Final PASS/BLOCKED summary
 *
 * This script NEVER invents a WER/CER/latency number. Every number it
 * prints came from an actual provider call against actual audio, or the
 * result is explicitly BLOCKED.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}

import { saharaProvider } from "../lib/speech/providers/sahara";
import { whisperProvider } from "../lib/speech/providers/whisper";
import { wav2vec2Provider } from "../lib/speech/providers/wav2vec2";
import { checkLocalModel, describeLocalModelProblem } from "../lib/speech/local-model";
import { WHISPER_TINY_REQUIRED_FILES, WAV2VEC2_BASE_REQUIRED_FILES, WEIGHT_FILE_CANDIDATES } from "../lib/speech/model-requirements";
import { BENCHMARK_DATASET } from "../lib/benchmark/dataset/dataset";
import { runAsrComparison, runIntentAccuracyBaseline } from "../lib/benchmark/runner";

const WHISPER_REQUIREMENT = {
  displayName: "Whisper Tiny",
  repoId: process.env.WHISPER_MODEL_ID || "openai/whisper-tiny",
  localDir: resolve(process.env.WHISPER_LOCAL_MODEL_PATH || join(process.cwd(), "models", "whisper-tiny")),
  requiredFiles: WHISPER_TINY_REQUIRED_FILES,
  weightFileCandidates: WEIGHT_FILE_CANDIDATES,
};

const WAV2VEC2_REQUIREMENT = {
  displayName: "Wav2Vec2 Base 960h",
  repoId: process.env.WAV2VEC2_MODEL_ID || "facebook/wav2vec2-base-960h",
  localDir: resolve(process.env.WAV2VEC2_LOCAL_MODEL_PATH || join(process.cwd(), "models", "wav2vec2-base-960h")),
  requiredFiles: WAV2VEC2_BASE_REQUIRED_FILES,
  weightFileCandidates: WEIGHT_FILE_CANDIDATES,
};

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

function readAudioAsArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function main() {
  console.log("=================================================================");
  console.log(" VoiceLearn Africa — Three-Model Benchmark Verification");
  console.log(" Sahara v2.5  |  Whisper Tiny (local)  |  Wav2Vec2 Base 960h (local)");
  console.log("=================================================================");

  section("1. Environment check");
  const envLocalPresent = existsSync(resolve(process.cwd(), ".env.local"));
  console.log(`.env.local present: ${envLocalPresent ? "yes" : "no (using process env / defaults)"}`);
  console.log(`SAHARA_API_KEY set: ${process.env.SAHARA_API_KEY ? "yes" : "no"}`);
  console.log(`WHISPER_LOCAL_MODEL_PATH: ${WHISPER_REQUIREMENT.localDir}`);
  console.log(`WAV2VEC2_LOCAL_MODEL_PATH: ${WAV2VEC2_REQUIREMENT.localDir}`);

  section("2 & 3. Local model path + file checks");
  const whisperCheck = checkLocalModel(WHISPER_REQUIREMENT);
  const wav2vecCheck = checkLocalModel(WAV2VEC2_REQUIREMENT);

  console.log(`Whisper Tiny:        directoryExists=${whisperCheck.directoryExists}  filesComplete=${whisperCheck.available}`);
  if (!whisperCheck.available) console.log(`  -> ${describeLocalModelProblem(WHISPER_REQUIREMENT, whisperCheck)}`);

  console.log(`Wav2Vec2 Base 960h:  directoryExists=${wav2vecCheck.directoryExists}  filesComplete=${wav2vecCheck.available}`);
  if (!wav2vecCheck.available) console.log(`  -> ${describeLocalModelProblem(WAV2VEC2_REQUIREMENT, wav2vecCheck)}`);

  section("4. Sahara connectivity/config check");
  let saharaHealthState = "unknown_error";
  if (saharaProvider.checkHealth) {
    const health = await saharaProvider.checkHealth();
    saharaHealthState = health.state;
    console.log(`Sahara health state: ${health.state}`);
    console.log(`  ${health.message}`);
  } else {
    console.log("saharaProvider does not implement checkHealth().");
  }

  section("5. Audio fixture check (physical audio vs. text-only fixtures)");
  const physicalAudioSamples = BENCHMARK_DATASET.filter((s) => s.audioFilePath && existsSync(s.audioFilePath));
  const textOnlySamples = BENCHMARK_DATASET.filter((s) => !s.audioFilePath || !existsSync(s.audioFilePath));
  console.log(`Total dataset samples: ${BENCHMARK_DATASET.length}`);
  console.log(`Physical audio recordings present on disk: ${physicalAudioSamples.length} (${physicalAudioSamples.map((s) => s.id).join(", ") || "none"})`);
  console.log(`Text-only fixtures (no audio file): ${textOnlySamples.length}`);
  const physicalCodeSwitched = physicalAudioSamples.filter((s) =>
    ["nigerian_pidgin", "english_pidgin", "english_yoruba", "educational_code_switching"].includes(s.category),
  );
  console.log(`Of those physical recordings, genuinely code-switched: ${physicalCodeSwitched.length}`);
  if (physicalCodeSwitched.length === 0) {
    console.log(
      "  -> PENDING HUMAN RECORDING: no physical code-switched audio recording exists yet. See DATASET.md Section 4.",
    );
  }

  section("6 & 7. Local model smoke tests (real audio, real inference — no fabrication)");
  const smokeSample = physicalAudioSamples[0];
  const smokeResults: Record<string, { ran: boolean; success: boolean; transcript?: string; error?: string }> = {};

  for (const [label, provider, check] of [
    ["whisper-tiny", whisperProvider, whisperCheck],
    ["wav2vec2-base-960h", wav2vec2Provider, wav2vecCheck],
  ] as const) {
    if (!check.available) {
      console.log(`${label}: SKIPPED — model files not complete locally (see LOCAL_MODEL_SETUP.md).`);
      smokeResults[label] = { ran: false, success: false };
      continue;
    }
    if (!smokeSample) {
      console.log(`${label}: SKIPPED — no physical audio sample available to test with.`);
      smokeResults[label] = { ran: false, success: false };
      continue;
    }
    try {
      const audioBytes = readAudioAsArrayBuffer(smokeSample.audioFilePath!);
      const result = await provider.transcribe({
        audioBytes,
        mimeType: "audio/wav",
        audioPath: smokeSample.audioFilePath!,
        languagePair: smokeSample.languagePair === "pcm" ? "en-pcm" : smokeSample.languagePair,
      });
      console.log(`${label}: SUCCESS — transcript: "${result.transcript}" (latency ${result.latencyMs}ms)`);
      smokeResults[label] = { ran: true, success: true, transcript: result.transcript };
    } catch (err) {
      console.log(`${label}: FAILED — ${(err as Error).message}`);
      smokeResults[label] = { ran: true, success: false, error: (err as Error).message };
    }
  }

  section("8. Full three-model benchmark execution");
  const asr = await runAsrComparison(["sahara", "whisper-tiny", "wav2vec2-base-960h"]);
  for (const summary of asr.summaries) {
    console.log(
      `  • ${summary.providerName}: measured=${summary.samplesMeasured}/${summary.totalDatasetSamples} | status=${summary.statusLabel}` +
      (summary.samplesMeasured > 0 ? ` | WER=${(summary.meanWer! * 100).toFixed(1)}% | CER=${(summary.meanCer! * 100).toFixed(1)}%` : ""),
    );
  }
  const intent = runIntentAccuracyBaseline();

  const reportsDir = join(process.cwd(), "lib", "benchmark", "reports");
  const resultsDir = join(process.cwd(), "benchmark", "results");
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(join(reportsDir, "asr-comparison-latest.json"), JSON.stringify(asr, null, 2));
  writeFileSync(join(reportsDir, "intent-baseline-latest.json"), JSON.stringify(intent, null, 2));
  writeFileSync(join(resultsDir, "raw-results.json"), JSON.stringify(asr.perSample, null, 2));
  writeFileSync(
    join(resultsDir, "summary.json"),
    JSON.stringify({ metadata: asr.metadata, summaries: asr.summaries, intentBaseline: intent.summary }, null, 2),
  );
  console.log(`\nWrote: ${join(resultsDir, "raw-results.json")}`);
  console.log(`Wrote: ${join(resultsDir, "summary.json")}`);

  section("9. Result validation (no fabricated results)");
  let validationOk = true;
  for (const row of asr.perSample) {
    if (row.status === "measured" && (row.hypothesisTranscript === null || row.hypothesisTranscript === undefined)) {
      console.log(`  ❌ INVALID: ${row.provider}/${row.sampleId} marked "measured" but has no transcript.`);
      validationOk = false;
    }
    if (row.status !== "measured" && (row.wer !== null || row.cer !== null)) {
      console.log(`  ❌ INVALID: ${row.provider}/${row.sampleId} is not measured but has a WER/CER value.`);
      validationOk = false;
    }
  }
  console.log(validationOk ? "  ✅ No invalid/fabricated rows found." : "  ❌ Validation failed — see above.");

  section("10. FINAL SUMMARY");

  const saharaSummary = asr.summaries.find((s) => s.provider === "sahara");
  const whisperSummary = asr.summaries.find((s) => s.provider === "whisper-tiny");
  const wav2vecSummary = asr.summaries.find((s) => s.provider === "wav2vec2-base-960h");

  const saharaVerified = (saharaSummary?.samplesMeasured ?? 0) > 0;
  const whisperVerified = (whisperSummary?.samplesMeasured ?? 0) > 0;
  const wav2vecVerified = (wav2vecSummary?.samplesMeasured ?? 0) > 0;

  console.log(`SAHARA:            ${saharaVerified ? "VERIFIED" : "BLOCKED"}  (health=${saharaHealthState}, measured=${saharaSummary?.samplesMeasured ?? 0})`);
  console.log(`WHISPER TINY:      ${whisperVerified ? "VERIFIED" : "BLOCKED"}  (filesComplete=${whisperCheck.available}, measured=${whisperSummary?.samplesMeasured ?? 0})`);
  console.log(`WAV2VEC2 BASE:     ${wav2vecVerified ? "VERIFIED" : "BLOCKED"}  (filesComplete=${wav2vecCheck.available}, measured=${wav2vecSummary?.samplesMeasured ?? 0})`);

  const allVerified = saharaVerified && whisperVerified && wav2vecVerified;
  console.log(
    `\nTHREE-MODEL BENCHMARK: ${allVerified ? "✅ VERIFIED — ready to include in the submission" : "❌ NOT YET VERIFIED — one or more models are still BLOCKED"}`,
  );
  if (!allVerified) {
    if (!whisperVerified) console.log("  - Whisper Tiny: complete the model files per LOCAL_MODEL_SETUP.md, then re-run this command.");
    if (!wav2vecVerified) console.log("  - Wav2Vec2 Base 960h: complete the model files per LOCAL_MODEL_SETUP.md, then re-run this command.");
    if (!saharaVerified) console.log("  - Sahara: set SAHARA_API_KEY in .env.local, then re-run this command.");
  }
}

main().catch((err) => {
  console.error("Verification run failed:", err);
  process.exit(1);
});
