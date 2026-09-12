import type { Metadata } from "next";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";
import { speechProviders } from "@/lib/speech/registry";

export const metadata: Metadata = {
  title: "Benchmark — VoiceLearn Africa",
};

export const dynamic = "force-dynamic";

export default async function BenchmarkPage() {
  const asr = await runAsrComparison();
  const intent = runIntentAccuracyBaseline();
  const evaluationDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto px-5 py-12 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl text-ink">Speech benchmark</h1>
        <p className="text-ink-soft leading-relaxed">
          Comparing Sahara against two general-purpose comparison speech models on the same
          evaluation dataset — plus a ground-truth baseline for the tutor&apos;s own educational
          understanding.
        </p>
        <p className="text-xs text-ink-soft/70">
          Dataset: {BENCHMARK_DATASET.length} samples · Evaluation date: {evaluationDate} · See{" "}
          <code className="font-mono">BENCHMARK_METHODOLOGY.md</code> for definitions.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-ink">ASR comparison</h2>
        <div className="overflow-x-auto border border-line rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-line-soft/50 text-left">
                <th className="px-3 py-2 font-medium">Provider</th>
                <th className="px-3 py-2 font-medium">Provider Status</th>
                <th className="px-3 py-2 font-medium">Audio on Disk</th>
                <th className="px-3 py-2 font-medium">Evaluated</th>
                <th className="px-3 py-2 font-medium">Mean WER</th>
                <th className="px-3 py-2 font-medium">Mean CER</th>
                <th className="px-3 py-2 font-medium">Code-switch preservation</th>
                <th className="px-3 py-2 font-medium">Median latency</th>
              </tr>
            </thead>
            <tbody>
              {asr.summaries.map((s) => (
                <tr key={s.providerName} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-medium">{s.providerName}</td>
                  <td className="px-3 py-2">
                    {s.isLive ? (
                      <span className="text-leaf font-medium">Live (authenticated)</span>
                    ) : (
                      <span className="text-ink-soft">Requires API Access</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{s.audioSamplesAvailable}/{s.totalDatasetSamples}</td>
                  <td className="px-3 py-2 text-ink-soft">{s.samplesMeasured}</td>
                  <td className="px-3 py-2 text-ink-soft">{s.meanWer ?? "—"}</td>
                  <td className="px-3 py-2 text-ink-soft">{s.meanCer ?? "—"}</td>
                  <td className="px-3 py-2 text-ink-soft">{s.meanCodeSwitchPreservation ?? "—"}</td>
                  <td className="px-3 py-2 text-ink-soft">{s.meanLatencyMs ? `${s.meanLatencyMs.toFixed(0)}ms` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-soft/70">
          {Object.values(speechProviders).every((p) => !p.isLive)
            ? "No provider has live credentials configured in this environment — see .env.example and REQUIRES_API_ACCESS notes in lib/speech/providers/. These are real measurements once credentials are added, not placeholders."
            : "Some providers are live — figures above reflect real measured runs for those providers only."}
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-8">
        <h2 className="font-display text-xl text-ink">
          Educational understanding baseline
        </h2>
        <p className="text-ink-soft leading-relaxed">
          This measures the tutor&apos;s intent/topic-extraction accuracy directly against the
          dataset&apos;s hand-labeled ground-truth transcripts — i.e. &ldquo;if speech recognition
          were perfect, how well does the downstream reasoning identify the right concept?&rdquo;
          It does not require Sahara or any ASR model, and it is a genuine, currently-measured
          result.
        </p>
        <div className="rounded-lg border border-line p-5 flex items-baseline gap-3">
          <span className="font-display text-4xl text-indigo">
            {(intent.summary.accuracy * 100).toFixed(1)}%
          </span>
          <span className="text-sm text-ink-soft">
            {intent.summary.correct} / {intent.summary.totalSamples} initial-question samples correctly mapped to their curriculum concept
          </span>
        </div>
      </section>

      <p className="text-xs text-ink-soft/70 border-t border-line pt-6">
        Reproduce this locally with <code className="font-mono">npm run benchmark</code>. Full
        methodology and per-sample results: <code className="font-mono">BENCHMARK_METHODOLOGY.md</code> and{" "}
        <code className="font-mono">BENCHMARK_RESULTS.md</code>.
      </p>
    </div>
  );
}
