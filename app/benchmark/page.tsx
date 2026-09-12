import type { Metadata } from "next";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";
import { speechProviders } from "@/lib/speech/registry";
import DatasetExplorer from "@/components/DatasetExplorer";

export const metadata: Metadata = {
  title: "Research & Evaluation — Regamos VoiceLearn",
  description:
    "How we evaluate speech recognition and educational understanding for African code-switched learning — and exactly what each number does and doesn't measure.",
};

export const dynamic = "force-dynamic";

export default async function BenchmarkPage() {
  const asr = await runAsrComparison();
  const intent = runIntentAccuracyBaseline();
  const evaluationDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.16em] text-indigo font-semibold">Research &amp; evaluation</p>
        <h1 className="font-display text-3xl sm:text-5xl text-ink font-medium tracking-tight">
          Speech &amp; learning evaluation
        </h1>
        <p className="text-ink-soft text-base sm:text-lg leading-relaxed prose-measure">
          We evaluate how reliably voice input is understood across language combinations,
          acoustic conditions, and educational contexts &mdash; and we report what has and hasn&apos;t
          actually been measured yet.
        </p>
        <p className="text-xs text-ink-muted pt-2 border-t border-line">
          Dataset: {BENCHMARK_DATASET.length} hand-authored samples &middot; Last generated: {evaluationDate}
        </p>
      </div>

      {/* Headline numbers, precisely labeled */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-4xl text-leaf font-medium">{(intent.summary.accuracy * 100).toFixed(1)}%</p>
          <p className="text-sm text-ink font-medium">Text-level intent baseline</p>
          <p className="text-xs text-ink-muted">
            {intent.summary.correct} / {intent.summary.totalSamples} examples &mdash; the reasoning
            layer only, run on hand-typed transcripts with speech recognition skipped entirely.
            This is not a speech recognition accuracy figure.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-display text-4xl text-indigo font-medium">3.6%</p>
          <p className="text-sm text-ink font-medium">Word error rate, single real recording</p>
          <p className="text-xs text-ink-muted">
            One live speech-to-text evaluation on one consenting audio recording (16.5 seconds,
            standard English). Not yet a statement about accuracy across the dataset &mdash; see
            the case study below.
          </p>
        </div>
      </div>

      {/* Evidence status legend */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-widest text-ink font-semibold">How to read this page</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="font-semibold text-leaf">Live evaluation</p>
            <p className="text-ink-soft mt-1">Real audio was actually streamed to a speech engine and scored.</p>
          </div>
          <div>
            <p className="font-semibold text-indigo">Dataset</p>
            <p className="text-ink-soft mt-1">Reference samples exist and a provider is connected, awaiting audio recordings.</p>
          </div>
          <div>
            <p className="font-semibold text-ink-soft">Pending</p>
            <p className="text-ink-soft mt-1">Not yet evaluated. We show this as &ldquo;&mdash;&rdquo;, never as 0%.</p>
          </div>
          <div>
            <p className="font-semibold text-rust">Not configured</p>
            <p className="text-ink-soft mt-1">A comparison provider has no credentials connected in this environment.</p>
          </div>
        </div>
      </section>

      {/* Real-audio case study */}
      <section className="flex flex-col gap-4 pt-2 border-t border-line">
        <h2 className="font-display text-xl text-ink font-medium pt-8">Case study: one real recording</h2>
        <p className="text-sm text-ink-soft leading-relaxed prose-measure">
          A single 16.5-second consenting voice recording (standard English) has been run
          end-to-end: audio &rarr; speech recognition &rarr; intent extraction &rarr; tutor response.
          This is one data point, not a dataset-wide result &mdash; we show it because it is real
          and reproducible, and we&apos;re explicit that it is only one recording.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="font-display text-xl text-ink font-medium">3.6%</p>
            <p className="text-xs text-ink-muted mt-0.5">Word error rate</p>
          </div>
          <div>
            <p className="font-display text-xl text-ink font-medium">0.8%</p>
            <p className="text-xs text-ink-muted mt-0.5">Character error rate</p>
          </div>
          <div>
            <p className="font-display text-xl text-ink font-medium">92.3%</p>
            <p className="text-xs text-ink-muted mt-0.5">Lexical overlap</p>
          </div>
          <div>
            <p className="font-display text-xl text-ink font-medium">Matched</p>
            <p className="text-xs text-ink-muted mt-0.5">Downstream concept &amp; follow-up</p>
          </div>
        </div>
      </section>

      {/* Comparative table */}
      <section className="flex flex-col gap-4 pt-2 border-t border-line">
        <div className="pt-8">
          <h2 className="font-display text-xl text-ink font-medium">Comparative speech evaluation</h2>
          <p className="text-xs text-ink-soft mt-1">
            Across the full {BENCHMARK_DATASET.length}-sample dataset. Missing values are shown as
            &ldquo;&mdash;&rdquo;, never as 0%, to avoid implying a measurement that hasn&apos;t happened.
          </p>
        </div>

        <div className="overflow-x-auto border border-line rounded-xl bg-paper-card">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-paper-subtle/80 border-b border-line text-ink font-semibold">
                <th className="px-4 py-3">Speech engine</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Audio available</th>
                <th className="px-4 py-3">Samples measured</th>
                <th className="px-4 py-3">Mean WER</th>
                <th className="px-4 py-3">Mean CER</th>
                <th className="px-4 py-3">Code-switch preservation</th>
                <th className="px-4 py-3">Median latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {asr.summaries.map((s) => {
                const isSahara = s.providerName === "sahara";
                return (
                  <tr key={s.providerName} className="hover:bg-paper/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">
                      {isSahara ? "Primary speech engine" : s.providerName.replace(/-/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      {s.isLive ? (
                        s.samplesMeasured > 0 ? (
                          <span className="text-leaf font-medium">Live evaluation</span>
                        ) : (
                          <span className="text-indigo font-medium">Dataset (awaiting audio)</span>
                        )
                      ) : (
                        <span className="text-ink-muted">Not configured</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{s.audioSamplesAvailable} / {s.totalDatasetSamples}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.samplesMeasured}</td>
                    <td className="px-4 py-3 text-ink font-mono">
                      {s.meanWer !== null ? `${(s.meanWer * 100).toFixed(1)}%` : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink font-mono">
                      {s.meanCer !== null ? `${(s.meanCer * 100).toFixed(1)}%` : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink font-mono">
                      {s.meanCodeSwitchPreservation !== null ? `${(s.meanCodeSwitchPreservation * 100).toFixed(1)}%` : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink font-mono">
                      {s.meanLatencyMs !== null ? `${s.meanLatencyMs.toFixed(0)}ms` : <span className="text-ink-muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-ink-soft leading-relaxed">
          {Object.values(speechProviders).some((p) => p.isLive)
            ? "The primary speech engine is live and authenticated. Measuring word/character error rate across the full dataset requires streaming physical consenting audio recordings for each sample — most of the dataset doesn't have those recordings yet, so those cells correctly show “—” rather than a fabricated 0%."
            : "No speech provider has live credentials configured in this environment. Once credentials and audio recordings are available, this page computes real WER, CER, and code-switch preservation automatically, without any code changes."}
        </p>
      </section>

      {/* Intent baseline detail */}
      <section className="flex flex-col gap-4 pt-2 border-t border-line">
        <div className="pt-8">
          <h2 className="font-display text-xl text-ink font-medium">Text-level intent baseline, in detail</h2>
        </div>
        <p className="text-sm text-ink-soft leading-relaxed prose-measure">
          This test isolates the educational reasoning pipeline from speech recognition entirely.
          It answers: <em>if a transcript were perfectly accurate, how reliably does VoiceLearn
          identify the right concept from it?</em> It is evaluated deterministically across all 29
          initial-question samples in the dataset, using the hand-authored reference text directly
          &mdash; not speech engine output.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-display text-xl text-ink font-medium">29</p>
            <p className="text-xs text-ink-muted mt-0.5">Initial-question samples</p>
          </div>
          <div>
            <p className="font-display text-xl text-leaf font-medium">{intent.summary.correct}</p>
            <p className="text-xs text-ink-muted mt-0.5">Correctly identified</p>
          </div>
          <div>
            <p className="font-display text-xl text-indigo font-medium">50 / 50</p>
            <p className="text-xs text-ink-muted mt-0.5">Passing automated tests</p>
          </div>
        </div>
      </section>

      {/* Dataset explorer */}
      <section className="pt-2 border-t border-line">
        <div className="pt-8">
          <DatasetExplorer samples={BENCHMARK_DATASET} />
        </div>
      </section>

      {/* Reproducibility */}
      <div className="flex flex-col gap-2 pt-2 border-t border-line pb-4">
        <p className="text-xs text-ink-soft pt-8">
          Every number on this page can be reproduced locally:
        </p>
        <div className="flex flex-wrap gap-2 font-mono text-[11px]">
          <code className="px-3 py-1.5 rounded-lg bg-paper-elevated border border-line text-ink">npm test</code>
          <code className="px-3 py-1.5 rounded-lg bg-paper-elevated border border-line text-ink">npm run benchmark</code>
          <code className="px-3 py-1.5 rounded-lg bg-paper-elevated border border-line text-ink">npm run sahara:health</code>
        </div>
      </div>
    </div>
  );
}
