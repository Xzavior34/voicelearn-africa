/**
 * VoiceLearn Africa — Single-command benchmark verification.
 *
 * Usage: npm run benchmark:verify
 *
 * Runs everything that can be checked without guessing, in order:
 *   1. Environment check            (.env.local / .env loaded, SAHARA_API_KEY presence)
 *   2. Model-path check             (do the local model directories exist)
 *   3. Model-file check             (are the required files + a weights file present)
 *   4. Sahara connectivity check    (real checkHealth() call, no fabrication)
 *   5. Audio fixture check          (physical audio vs. text-only fixtures; physical
 *                                    CODE-SWITCHED audio specifically)
 *   6-8. Local model smoke tests    (real transcribe() call on real audio, only if files present)
 *   9. Benchmark execution          (the real runAsrComparison(), same as `npm run benchmark`)
 *  10. Result validation            (no measured sample may have a null transcript;
 *                                    a blocked model may not show as measured)
 *  11. Final VERIFIED/BLOCKED summary, with a hard, non-zero exit if any
 *      required model was not actually measured on real audio.
 *
 * This script NEVER invents a WER/CER/latency number. Every number it
 * prints came from an actual provider call against actual audio, or the
 * result is explicitly BLOCKED. Passing `--soft` disables the hard exit
 * (useful while you're still gathering model files/keys), but the
 * default behavior fails loudly — this is meant to be trustworthy
 * enough to gate a submission, not just informative.
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
import { whisperBaseProvider } from "../lib/speech/providers/whisper-base";
import { wav2vec2Provider } from "../lib/speech/providers/wav2vec2";
import { checkLocalModel, describeLocalModelProblem } from "../lib/speech/local-model";
import {
  WHISPER_TINY_REQUIRED_FILES,
  WHISPER_BASE_REQUIRED_FILES,
  WAV2VEC2_BASE_REQUIRED_FILES,
  WEIGHT_FILE_CANDIDATES,
} from "../lib/speech/model-requirements";
import { BENCHMARK_DATASET } from "../lib/benchmark/dataset/dataset";
import { runAsrComparison, runIntentAccuracyBaseline } from "../lib/benchmark/runner";

const CODE_SWITCH_CATEGORIES = ["nigerian_pidgin", "english_pidgin", "english_yoruba", "educational_code_switching"];
const SOFT_MODE = process.argv.includes("--soft");

const WHISPER_TINY_REQUIREMENT = {
  displayName: "Whisper Tiny",
  repoId: process.env.WHISPER_MODEL_ID || "openai/whisper-tiny",
  localDir: resolve(process.env.WHISPER_LOCAL_MODEL_PATH || join(process.cwd(), "models", "whisper-tiny")),
  requiredFiles: WHISPER_TINY_REQUIRED_FILES,
  weightFileCandidates: WEIGHT_FILE_CANDIDATES,
};

const WHISPER_BASE_REQUIREMENT = {
  displayName: "Whisper Base",
  repoId: process.env.WHISPER_BASE_MODEL_ID || "openai/whisper-base",
  localDir: resolve(process.env.WHISPER_BASE_LOCAL_MODEL_PATH || join(process.cwd(), "models", "whisper-base")),
  requiredFiles: WHISPER_BASE_REQUIRED_FILES,
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
  console.log(" VoiceLearn Africa — Four-Model Benchmark Verification");
  console.log(" Sahara v2.5 | Whisper Tiny | Whisper Base | Wav2Vec2 Base 960h (all local except Sahara)");
  console.log("=================================================================");

  section("1. Environment check");
  console.log(`.env.local present: ${existsSync(resolve(process.cwd(), ".env.local")) ? "yes" : "no (using process env / defaults)"}`);
  console.log(`SAHARA_API_KEY set: ${process.env.SAHARA_API_KEY ? "yes" : "no"}`);

  section("2 & 3. Local model path + file checks");
  const checks = {
    "whisper-tiny": checkLocalModel(WHISPER_TINY_REQUIREMENT),
    "whisper-base": checkLocalModel(WHISPER_BASE_REQUIREMENT),
    "wav2vec2-base-960h": checkLocalModel(WAV2VEC2_REQUIREMENT),
  };
  const requirements = {
    "whisper-tiny": WHISPER_TINY_REQUIREMENT,
    "whisper-base": WHISPER_BASE_REQUIREMENT,
    "wav2vec2-base-960h": WAV2VEC2_REQUIREMENT,
  };
  for (const [label, check] of Object.entries(checks)) {
    console.log(`${label}:  directoryExists=${check.directoryExists}  filesComplete=${check.available}`);
    if (!check.available) {
      console.log(`  -> ${describeLocalModelProblem(requirements[label as keyof typeof requirements], check)}`);
    }
  }

  section("4. Sahara connectivity/config check");
  let saharaHealthState = "unknown_error";
  if (saharaProvider.checkHealth) {
    const health = await saharaProvider.checkHealth();
    saharaHealthState = health.state;
    console.log(`Sahara health state: ${health.state}`);
    console.log(`  ${health.message}`);
  }

  section("5. Audio fixture check (physical audio, physical code-switched audio, vs. text-only fixtures)");
  const physicalAudioSamples = BENCHMARK_DATASET.filter((s) => s.audioFilePath && existsSync(s.audioFilePath));
  const textOnlySamples = BENCHMARK_DATASET.filter((s) => !s.audioFilePath || !existsSync(s.audioFilePath));
  const physicalCodeSwitched = physicalAudioSamples.filter((s) => CODE_SWITCH_CATEGORIES.includes(s.category));
  console.log(`Total dataset samples: ${BENCHMARK_DATASET.length}`);
  console.log(`Physical audio recordings present on disk: ${physicalAudioSamples.length} (${physicalAudioSamples.map((s) => s.id).join(", ") || "none"})`);
  console.log(`Text-only fixtures (no audio file): ${textOnlySamples.length}`);
  console.log(`Physical CODE-SWITCHED audio recordings: ${physicalCodeSwitched.length}`);
  if (physicalCodeSwitched.length === 0) {
    console.log("  -> PENDING HUMAN RECORDING: no physical code-switched audio recording exists yet. See DATASET.md Section 4.");
  }

  section("6-8. Local model smoke tests (real audio, real inference — no fabrication)");
  const smokeSample = physicalAudioSamples[0];
  const localProviders = [
    ["whisper-tiny", whisperProvider, checks["whisper-tiny"]],
    ["whisper-base", whisperBaseProvider, checks["whisper-base"]],
    ["wav2vec2-base-960h", wav2vec2Provider, checks["wav2vec2-base-960h"]],
  ] as const;

  for (const [label, provider, check] of localProviders) {
    if (!check.available) {
      console.log(`${label}: SKIPPED — model files not complete locally (see LOCAL_MODEL_SETUP.md).`);
      continue;
    }
    if (!smokeSample) {
      console.log(`${label}: SKIPPED — no physical audio sample available to test with.`);
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
    } catch (err) {
      console.log(`${label}: FAILED — ${(err as Error).message}`);
    }
  }

  section("9. Full four-model benchmark execution");
  const MODELS = ["sahara", "whisper-tiny", "whisper-base", "wav2vec2-base-960h"];
  const asr = await runAsrComparison(MODELS);
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

  section("10. Result validation (no fabricated results)");
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

  section("11. FINAL SUMMARY");

  console.log(`sahara health=${saharaHealthState}`);
  const requiredModelIds = ["sahara", "whisper-tiny", "whisper-base", "wav2vec2-base-960h"];
  const verifiedFlags: Record<string, boolean> = {};
  for (const id of requiredModelIds) {
    const summary = asr.summaries.find((s) => s.provider === id);
    verifiedFlags[id] = (summary?.samplesMeasured ?? 0) > 0;
    console.log(`${id.padEnd(20)} ${verifiedFlags[id] ? "VERIFIED" : "BLOCKED"}  (${summary?.statusLabel ?? "not run"}, measured=${summary?.samplesMeasured ?? 0})`);
  }

  const allModelsVerified = requiredModelIds.every((id) => verifiedFlags[id]);
  const hasPhysicalAudio = physicalAudioSamples.length > 0;
  const hasPhysicalCodeSwitchedAudio = physicalCodeSwitched.length > 0;
  const noFabrication = validationOk;

  console.log(`\nPhysical audio present:               ${hasPhysicalAudio ? "YES" : "NO"}`);
  console.log(`Physical code-switched audio present: ${hasPhysicalCodeSwitchedAudio ? "YES" : "NO — PENDING HUMAN RECORDING"}`);
  console.log(`Benchmark artifacts generated:          YES (written above)`);
  console.log(`No fabricated metrics:                  ${noFabrication ? "YES" : "NO — SEE VALIDATION ERRORS ABOVE"}`);

  const overallPass = allModelsVerified && hasPhysicalAudio && hasPhysicalCodeSwitchedAudio && noFabrication;

  console.log(
    `\nFOUR-MODEL BENCHMARK: ${overallPass ? "✅ VERIFIED — ready to include in the submission" : "❌ NOT YET VERIFIED"}`,
  );
  if (!overallPass) {
    if (!verifiedFlags["sahara"]) console.log("  - Sahara: set SAHARA_API_KEY in .env.local, then re-run.");
    if (!verifiedFlags["whisper-tiny"]) console.log("  - Whisper Tiny: complete the model files per LOCAL_MODEL_SETUP.md, then re-run.");
    if (!verifiedFlags["whisper-base"]) console.log("  - Whisper Base: download and place model files per LOCAL_MODEL_SETUP.md, then re-run.");
    if (!verifiedFlags["wav2vec2-base-960h"]) console.log("  - Wav2Vec2 Base 960h: complete the model files per LOCAL_MODEL_SETUP.md, then re-run.");
    if (!hasPhysicalCodeSwitchedAudio) console.log("  - Code-switch audio: record the pending sample per DATASET.md Section 4.");
  }

  if (!overallPass && !SOFT_MODE) {
    console.log("\nExiting non-zero: not all required models are measured yet. Pass --soft to disable this while iterating.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Verification run failed:", err);
  process.exit(1);
});
