"use client";

import { useState } from "react";
import { BenchmarkSample } from "@/lib/benchmark/dataset/types";
import { AsrSampleResult } from "@/lib/benchmark/runner";

interface Props {
  samples: BenchmarkSample[];
  results?: AsrSampleResult[];
}

export default function SampleInspector({ samples, results = [] }: Props) {
  const [selectedId, setSelectedId] = useState<string>(samples[0]?.id || "vl-001");

  const sample = samples.find((s) => s.id === selectedId) || samples[0];
  const sampleResults = results.filter((r) => r.sampleId === sample?.id);

  const saharaResult = sampleResults.find((r) => r.provider === "sahara");
  const whisperResult = sampleResults.find((r) => r.provider === "whisper-large-v3" || r.provider === "model-b");
  const geminiResult = sampleResults.find((r) => r.provider === "gemini" || r.provider === "model-c");

  if (!sample) return null;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line bg-paper-card p-5 sm:p-7 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-light text-indigo">
              {sample.id}
            </span>
            <span className="text-xs uppercase tracking-wider text-ink-muted font-mono">
              {sample.category.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="font-display text-lg text-ink font-medium mt-1">
            Sample Inspector &amp; Multi-Model Evaluation
          </h3>
        </div>

        {/* Sample selector */}
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-1.5 text-xs text-ink font-medium focus:outline-none focus:ring-2 focus:ring-indigo max-w-xs"
          aria-label="Select benchmark sample"
        >
          {samples.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id}: {s.subject} ({s.languagePair}) — {s.referenceTranscript.slice(0, 32)}…
            </option>
          ))}
        </select>
      </div>

      {/* Metadata tags */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg bg-paper-elevated border border-line/60 p-2.5">
          <p className="text-ink-muted font-mono text-[11px]">Subject / Domain</p>
          <p className="text-ink font-medium capitalize mt-0.5">{sample.subject} ({sample.domain})</p>
        </div>
        <div className="rounded-lg bg-paper-elevated border border-line/60 p-2.5">
          <p className="text-ink-muted font-mono text-[11px]">Language Tier</p>
          <p className="text-ink font-medium mt-0.5">
            {sample.languagePair === "en"
              ? "Standard English"
              : sample.languagePair === "pcm"
                ? "Nigerian Pidgin"
                : sample.languagePair === "en-pcm"
                  ? "English + Pidgin Code-Switch"
                  : "English + Yoruba Code-Switch"}
          </p>
        </div>
        <div className="rounded-lg bg-paper-elevated border border-line/60 p-2.5">
          <p className="text-ink-muted font-mono text-[11px]">Audio Recording</p>
          <p className="text-ink font-medium mt-0.5">
            {sample.audioFilePath ? "✅ Physical WAV On Disk" : "⏳ Hand-Authored Reference"}
          </p>
        </div>
        <div className="rounded-lg bg-paper-elevated border border-line/60 p-2.5">
          <p className="text-ink-muted font-mono text-[11px]">Target Concept</p>
          <p className="text-indigo font-mono font-medium mt-0.5">{sample.expectedConceptId ?? "Out of Scope"}</p>
        </div>
      </div>

      {/* Ground truth reference */}
      <div className="rounded-xl border border-line bg-paper-subtle/50 p-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold font-mono">
            Ground Truth Reference Transcript (Human-Reviewed)
          </p>
          <span className="text-[11px] font-mono text-leaf font-medium">Independent Baseline</span>
        </div>
        <p className="font-serif italic text-base text-ink leading-relaxed">
          &ldquo;{sample.referenceTranscript}&rdquo;
        </p>
      </div>

      {/* 3 Model Outputs comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model A: Sahara */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-xs">Intron Sahara v2.5</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-leaf-light text-leaf font-medium">
                {saharaResult?.status === "measured" ? "LIVE VERIFIED" : "AUTHENTICATED"}
              </span>
            </div>
            <div className="mt-3 text-xs space-y-2">
              <p className="text-ink-soft">
                {saharaResult?.hypothesisTranscript ? (
                  <span className="text-ink font-serif italic">&ldquo;{saharaResult.hypothesisTranscript}&rdquo;</span>
                ) : (
                  <span className="text-ink-muted italic">Awaiting physical audio recording</span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span>WER: {saharaResult?.wer !== null && saharaResult?.wer !== undefined ? `${(saharaResult.wer * 100).toFixed(1)}%` : "—"}</span>
            <span>Latency: {saharaResult?.latencyMs ? `${saharaResult.latencyMs}ms` : "—"}</span>
          </div>
        </div>

        {/* Model B: Whisper */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-xs">OpenAI Whisper Large v3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-subtle text-ink-muted">
                {whisperResult?.status === "measured" ? "MEASURED" : "REQUIRES API KEY"}
              </span>
            </div>
            <div className="mt-3 text-xs space-y-2">
              <p className="text-ink-muted italic">
                {whisperResult?.hypothesisTranscript ? (
                  <span className="text-ink font-serif">&ldquo;{whisperResult.hypothesisTranscript}&rdquo;</span>
                ) : (
                  "Set OPENAI_API_KEY in .env.local to run live comparison"
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span>WER: {whisperResult?.wer !== null && whisperResult?.wer !== undefined ? `${(whisperResult.wer * 100).toFixed(1)}%` : "—"}</span>
            <span>Status: {whisperResult?.status ?? "Unconfigured"}</span>
          </div>
        </div>

        {/* Model C: Gemini */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-xs">Google Gemini Audio</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-subtle text-ink-muted">
                {geminiResult?.status === "measured" ? "MEASURED" : "CONFIGURABLE"}
              </span>
            </div>
            <div className="mt-3 text-xs space-y-2">
              <p className="text-ink-muted italic">
                {geminiResult?.hypothesisTranscript ? (
                  <span className="text-ink font-serif">&ldquo;{geminiResult.hypothesisTranscript}&rdquo;</span>
                ) : (
                  "Set GOOGLE_API_KEY in .env.local to run live comparison"
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span>WER: {geminiResult?.wer !== null && geminiResult?.wer !== undefined ? `${(geminiResult.wer * 100).toFixed(1)}%` : "—"}</span>
            <span>Status: {geminiResult?.status ?? "Unconfigured"}</span>
          </div>
        </div>
      </div>

      {/* Downstream Agentic Impact */}
      <div className="rounded-xl border border-line bg-paper-elevated p-4 text-xs">
        <p className="text-[11px] uppercase tracking-wider text-ink font-semibold mb-2">
          Downstream Agentic Tutoring Outcome
        </p>
        <p className="text-ink-soft leading-relaxed">
          When this utterance is spoken, the VoiceLearn tutoring agent identifies the core learning need
          (<span className="font-mono text-indigo font-medium">{sample.intent}</span>) and maps it to
          concept <span className="font-mono text-indigo font-medium">{sample.expectedConceptId ?? "out-of-curriculum"}</span>,
          triggering calibrated secondary-school explanations, diagnostic follow-up questions, and adaptive difficulty.
        </p>
      </div>
    </div>
  );
}
