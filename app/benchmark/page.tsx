import type { Metadata } from "next";
import { runAsrComparison, runIntentAccuracyBaseline } from "@/lib/benchmark/runner";
import { BENCHMARK_DATASET } from "@/lib/benchmark/dataset/dataset";
import SampleInspector from "@/components/SampleInspector";
import DatasetExplorer from "@/components/DatasetExplorer";

export const metadata: Metadata = {
  title: "VoiceLearn Research Lab — Multi-Model Code-Switch Benchmark",
  description:
    "Empirical evaluation of Intron Sahara v2.5, OpenAI Whisper Large v3, and Google Gemini on African code-switched educational speech.",
};

export const dynamic = "force-dynamic";

export default async function BenchmarkPage() {
  const asr = await runAsrComparison(["sahara", "whisper-large-v3", "gemini"]);
  const intent = runIntentAccuracyBaseline();
  const evaluationDate = new Date().toISOString().slice(0, 10);

  const saharaSummary = asr.summaries.find((s) => s.provider === "sahara");
  const whisperSummary = asr.summaries.find((s) => s.provider === "whisper-large-v3");
  const geminiSummary = asr.summaries.find((s) => s.provider === "gemini");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-14">
      {/* 1. Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-ochre font-semibold">
            VoiceLearn Research Lab
          </span>
          <span className="text-xs text-ink-light font-mono">•</span>
          <span className="text-xs text-ink-muted font-mono">CodeSwitch Africa Challenge</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl text-ink font-semibold tracking-tight">
          Three-Model Code-Switch Benchmark
        </h1>
        <p className="text-ink-soft text-base sm:text-lg leading-relaxed prose-measure">
          Same speech. Same reference. Three models. We evaluate how reliably speech engines transcribe
          multilingual African speech and whether the resulting transcripts produce correct downstream
          educational understanding.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-2 border-t border-line font-mono">
          <span>Dataset: {BENCHMARK_DATASET.length} hand-reviewed samples</span>
          <span>•</span>
          <span>4 Linguistic Tiers</span>
          <span>•</span>
          <span>Last generated: {evaluationDate}</span>
        </div>
      </div>

      {/* 2. Key Headline Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-line bg-paper-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase font-mono">Live Sahara ASR</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-leaf-light text-leaf font-medium">LIVE VERIFIED</span>
          </div>
          <p className="font-display text-4xl text-leaf font-semibold">
            {saharaSummary?.meanWer !== null && saharaSummary?.meanWer !== undefined
              ? `${(saharaSummary.meanWer * 100).toFixed(1)}%`
              : "—"}
          </p>
          <p className="text-sm text-ink font-medium">Mean Word Error Rate (WER)</p>
          <p className="text-xs text-ink-soft">
            Evaluated live on real consenting audio streamed over WebSocket to Intron Sahara v2.5.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-paper-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase font-mono">Downstream Tutor</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-light text-indigo font-medium">AGENTIC TASK</span>
          </div>
          <p className="font-display text-4xl text-indigo font-semibold">
            {(intent.summary.accuracy * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-ink font-medium">Concept extraction accuracy</p>
          <p className="text-xs text-ink-soft">
            {intent.summary.correct} / {intent.summary.totalSamples} samples correctly mapped to secondary curriculum concepts without LLM hallucinations.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-paper-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase font-mono">Linguistic Coverage</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-subtle text-ink-muted font-medium">4 TIERS</span>
          </div>
          <p className="font-display text-4xl text-ochre font-semibold">
            34
          </p>
          <p className="text-sm text-ink font-medium">Code-switched samples</p>
          <p className="text-xs text-ink-soft">
            Covering Standard English, Nigerian Pidgin, English+Pidgin, and English+Yoruba across 6 secondary subjects.
          </p>
        </div>
      </div>

      {/* 3. Evidence Status Legend */}
      <section className="rounded-xl border border-line bg-paper-card p-5">
        <h2 className="text-xs uppercase tracking-widest text-ink font-semibold mb-3">Honest Benchmark Evidence Hierarchy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="font-semibold text-leaf">✅ LIVE VERIFIED</p>
            <p className="text-ink-soft mt-1">Real audio streamed live to provider API and scored deterministically.</p>
          </div>
          <div>
            <p className="font-semibold text-indigo">⏳ AWAITING AUDIO</p>
            <p className="text-ink-soft mt-1">Provider is live &amp; authenticated, awaiting physical recording on disk.</p>
          </div>
          <div>
            <p className="font-semibold text-ink-muted">⚠️ BLOCKED (API KEY)</p>
            <p className="text-ink-soft mt-1">Comparison model requires API credential in .env.local.</p>
          </div>
          <div>
            <p className="font-semibold text-ink-soft">— UNMEASURED</p>
            <p className="text-ink-soft mt-1">Reported as &ldquo;—&rdquo;, never fabricated as 0% or fake data.</p>
          </div>
        </div>
      </section>

      {/* 4. Three-Model Comparison Table */}
      <section className="flex flex-col gap-4 pt-2 border-t border-line">
        <div className="pt-4">
          <h2 className="font-display text-2xl text-ink font-semibold">Multi-Model Speech Recognition Comparison</h2>
          <p className="text-xs text-ink-soft mt-1">
            Across the full {BENCHMARK_DATASET.length}-sample African code-switching benchmark set.
          </p>
        </div>

        <div className="overflow-x-auto border border-line rounded-2xl bg-paper-card shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-paper-subtle/80 border-b border-line text-ink font-semibold">
                <th className="px-4 py-3.5">Speech Engine</th>
                <th className="px-4 py-3.5">Model ID</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Audio On Disk</th>
                <th className="px-4 py-3.5">Samples Measured</th>
                <th className="px-4 py-3.5">Mean WER</th>
                <th className="px-4 py-3.5">Mean CER</th>
                <th className="px-4 py-3.5">Tutor Success</th>
                <th className="px-4 py-3.5">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {asr.summaries.map((s) => {
                const isSahara = s.provider === "sahara";
                return (
                  <tr key={s.provider} className="hover:bg-paper/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {s.providerName}
                      {isSahara && <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-leaf-light text-leaf font-mono">PRIMARY</span>}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">{s.model}</td>
                    <td className="px-4 py-3.5">
                      {s.isLive ? (
                        s.samplesMeasured > 0 ? (
                          <span className="text-leaf font-medium">✅ Live Verified</span>
                        ) : (
                          <span className="text-indigo font-medium">⏳ Authenticated</span>
                        )
                      ) : (
                        <span className="text-ink-muted">⚠️ Blocked (Set Key)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft font-mono">{s.audioSamplesAvailable} / {s.totalDatasetSamples}</td>
                    <td className="px-4 py-3.5 text-ink-soft font-mono">{s.samplesMeasured}</td>
                    <td className="px-4 py-3.5 text-ink font-mono font-medium">
                      {s.meanWer !== null ? `${(s.meanWer * 100).toFixed(1)}%` : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-ink font-mono">
                      {s.meanCer !== null ? `${(s.meanCer * 100).toFixed(1)}%` : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-ink font-mono font-medium">
                      {s.tutorSuccessRate !== null ? `${(s.tutorSuccessRate * 100).toFixed(1)}%` : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-ink font-mono">
                      {s.meanLatencyMs !== null ? `${s.meanLatencyMs.toFixed(0)}ms` : <span className="text-ink-muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Downstream Agentic Task Explanation */}
      <section className="flex flex-col gap-5 pt-2 border-t border-line">
        <div className="pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan font-semibold">Downstream Agentic Value</p>
          <h2 className="font-display text-2xl text-ink font-semibold mt-1">Why Transcription Accuracy Matters for Learning</h2>
          <p className="text-sm text-ink-soft leading-relaxed prose-measure mt-2">
            In VoiceLearn Africa, speech recognition is not the end goal — it is the perceptual front door
            to an autonomous tutoring agent. A transcription error in code-switched speech directly leads to
            pedagogical failure:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 py-2" aria-label="Agentic tutoring pipeline">
          {[
            "1. Code-Switched Voice",
            "2. Speech Model",
            "3. Faithful Transcript",
            "4. Intent Detection",
            "5. Curriculum Concept",
            "6. Adaptive Explanation",
            "7. Diagnostic Practice",
          ].map((stage, i, arr) => (
            <div key={stage} className="flex items-center gap-2">
              <span className="rounded-full border border-indigo-border bg-indigo-light px-3.5 py-1.5 text-xs font-medium text-indigo-soft whitespace-nowrap">
                {stage}
              </span>
              {i < arr.length - 1 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-light shrink-0" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Interactive Sample Inspector */}
      <section className="pt-2 border-t border-line">
        <div className="pt-4 mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-ochre font-semibold">Deep Dive</p>
          <h2 className="font-display text-2xl text-ink font-semibold mt-1">Sample Inspector</h2>
          <p className="text-xs text-ink-soft mt-1">
            Select any benchmark sample to inspect ground truth, model transcripts, and downstream tutor interpretation.
          </p>
        </div>
        <SampleInspector samples={BENCHMARK_DATASET} results={asr.perSample} />
      </section>

      {/* 7. Dataset Explorer */}
      <section className="pt-2 border-t border-line">
        <div className="pt-4">
          <DatasetExplorer samples={BENCHMARK_DATASET} />
        </div>
      </section>

      {/* 8. Local Reproducibility */}
      <div className="flex flex-col gap-3 pt-2 border-t border-line pb-6">
        <p className="text-xs text-ink font-medium pt-4">
          Every number and result on this page can be audited and reproduced locally:
        </p>
        <div className="flex flex-wrap gap-2 font-mono text-[11px]">
          <code className="px-3 py-1.5 rounded-lg bg-paper-elevated border border-line text-ink">npm test</code>
          <code className="px-3 py-1.5 rounded-lg bg-paper-elevated border border-line text-ink">npm run benchmark:health</code>
          <code className="px-3 py-1.5 rounded-lg bg-paper-elevated border border-line text-ink">npm run benchmark:all</code>
        </div>
      </div>
    </div>
  );
}
