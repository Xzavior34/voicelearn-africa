/**
 * Reproducible benchmark CLI.
 *
 * Usage: npm run benchmark
 *
 * Runs both parts of the benchmark and writes raw + aggregate results
 * to lib/benchmark/reports/. Never fabricates a result: providers
 * without live credentials honestly report "requires_api_access".
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
  const reportsDir = join(__dirname, "..", "lib", "benchmark", "reports");
  mkdirSync(reportsDir, { recursive: true });

  console.log(`Loaded ${BENCHMARK_DATASET.length} dataset samples.`);
  console.log("\n=== Part 1: ASR comparison (Sahara / Model B / Model C) ===");
  const asr = await runAsrComparison();
  for (const summary of asr.summaries) {
    console.log(
      `  ${summary.providerName}: live=${summary.isLive} measured=${summary.samplesMeasured}/${summary.samplesAttempted} meanWER=${summary.meanWer ?? "N/A"}`,
    );
  }
  writeFileSync(join(reportsDir, "asr-comparison-latest.json"), JSON.stringify(asr, null, 2));

  console.log("\n=== Part 2: Intent/topic extraction baseline (ground-truth transcripts) ===");
  const intent = runIntentAccuracyBaseline();
  console.log(
    `  accuracy=${(intent.summary.accuracy * 100).toFixed(1)}% (${intent.summary.correct}/${intent.summary.totalSamples})`,
  );
  writeFileSync(join(reportsDir, "intent-baseline-latest.json"), JSON.stringify(intent, null, 2));

  const evaluationDate = new Date().toISOString().slice(0, 10);
  const summaryMd = `# Benchmark run: ${evaluationDate}

## ASR comparison (per provider)

| Provider | Live | Samples measured | Mean WER | Mean CER | Mean code-switch preservation |
|---|---|---|---|---|---|
${asr.summaries
  .map(
    (s) => {
      const fallback = s.isLive ? "LOCAL_DEVICE_TEST_REQUIRED" : "REQUIRES_API_ACCESS";
      return `| ${s.providerName} | ${s.isLive} | ${s.samplesMeasured}/${s.samplesAttempted} | ${s.meanWer ?? fallback} | ${s.meanCer ?? fallback} | ${s.meanCodeSwitchPreservation ?? fallback} |`;
    },
  )
  .join("\n")}

## Intent/topic extraction baseline (ground-truth transcripts, no ASR)

Accuracy: **${(intent.summary.accuracy * 100).toFixed(1)}%** (${intent.summary.correct}/${intent.summary.totalSamples} samples)

This measures the tutor reasoning layer in isolation (see lib/tutor/intent.ts),
assuming perfect transcription. It does NOT measure Sahara or any ASR model —
see BENCHMARK_RESULTS.md for what remains pending live API access.
`;
  writeFileSync(join(reportsDir, "SUMMARY-latest.md"), summaryMd);
  console.log(`\nReports written to ${reportsDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
