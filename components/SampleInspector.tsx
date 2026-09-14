"use client";

import { useState } from "react";
import { BenchmarkSample } from "@/lib/benchmark/dataset/types";
import { AsrSampleResult } from "@/lib/benchmark/runner";

interface Props {
  samples: BenchmarkSample[];
  results?: AsrSampleResult[];
}

export default function SampleInspector({ samples, results = [] }: Props) {
  const [selectedId, setSelectedId] = useState<string>(samples[0]?.id || "sample-001");

  const sample = samples.find((s) => s.id === selectedId) || samples[0];
  const sampleResults = results.filter((r) => r.sampleId === sample?.id);

  const saharaResult = sampleResults.find((r) => r.provider === "sahara");
  const whisperResult = sampleResults.find((r) => r.provider === "whisper-tiny" || r.provider === "model-b");
  const whisperBaseResult = sampleResults.find((r) => r.provider === "whisper-base");
  const wav2vecResult = sampleResults.find((r) => r.provider === "wav2vec2-base-960h" || r.provider === "model-c");

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

      {/* 4 Model Outputs comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model A: Sahara */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-xs">Intron Sahara v2.5</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-leaf-light text-leaf font-medium">
                {saharaResult?.status === "measured" ? "LIVE VERIFIED" : "REMOTE API"}
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

        {/* Model B: Whisper Tiny */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-xs">Whisper Tiny</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-subtle text-ink-muted font-medium">
                LOCAL, FILESYSTEM-ONLY
              </span>
            </div>
            <div className="mt-3 text-xs space-y-2">
              <p className="text-ink-muted italic">
                {whisperResult?.hypothesisTranscript ? (
                  <span className="text-ink font-serif">&ldquo;{whisperResult.hypothesisTranscript}&rdquo;</span>
                ) : (
                  "Local inference runner (Apache-2.0, zero paid API)"
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span>WER: {whisperResult?.wer !== null && whisperResult?.wer !== undefined ? `${(whisperResult.wer * 100).toFixed(1)}%` : "—"}</span>
            <span>Latency: {whisperResult?.latencyMs ? `${whisperResult.latencyMs}ms` : "—"}</span>
          </div>
        </div>

        {/* Model C: Whisper Base */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-xs">Whisper Base</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-subtle text-ink-muted font-medium">
                LOCAL, FILESYSTEM-ONLY
              </span>
            </div>
            <div className="mt-3 text-xs space-y-2">
              <p className="text-ink-muted italic">
                {whisperBaseResult?.hypothesisTranscript ? (
                  <span className="text-ink font-serif">&ldquo;{whisperBaseResult.hypothesisTranscript}&rdquo;</span>
                ) : (
                  "Local inference runner (Apache-2.0, zero paid API)"
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span>WER: {whisperBaseResult?.wer !== null && whisperBaseResult?.wer !== undefined ? `${(whisperBaseResult.wer * 100).toFixed(1)}%` : "—"}</span>
            <span>Latency: {whisperBaseResult?.latencyMs ? `${whisperBaseResult.latencyMs}ms` : "—"}</span>
          </div>
        </div>

        {/* Model D: Wav2Vec2 Base 960h */}
        <div className="flex flex-col justify-between rounded-xl border border-line bg-paper p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink text-xs">Wav2Vec2 Base 960h</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-subtle text-ink-muted font-medium">
                LOCAL BASELINE
              </span>
            </div>
            <div className="mt-3 text-xs space-y-2">
              <p className="text-ink-muted italic">
                {wav2vecResult?.hypothesisTranscript ? (
                  <span className="text-ink font-serif uppercase">&ldquo;{wav2vecResult.hypothesisTranscript}&rdquo;</span>
                ) : (
                  "English LibriSpeech baseline (Apache-2.0, zero paid API)"
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span>WER: {wav2vecResult?.wer !== null && wav2vecResult?.wer !== undefined ? `${(wav2vecResult.wer * 100).toFixed(1)}%` : "—"}</span>
            <span>Latency: {wav2vecResult?.latencyMs ? `${wav2vecResult.latencyMs}ms` : "—"}</span>
          </div>
        </div>
      </div>

      {/* Downstream Agentic Task Assessment */}
      {saharaResult?.downstream && (
        <div className="rounded-xl border border-indigo-border bg-indigo-light/30 p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-semibold text-indigo uppercase">
              Downstream Agentic Pipeline Trace
            </span>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-medium ${
                saharaResult.downstream.tutorSuccess
                  ? "bg-leaf-light text-leaf"
                  : "bg-terracotta-light text-terracotta"
              }`}
            >
              {saharaResult.downstream.tutorSuccess ? "TUTOR SUCCESS" : "ALIGNMENT FAILED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="bg-paper p-3 rounded-lg border border-line/60">
              <p className="text-ink-muted font-mono text-[10px]">1. Intent Alignment</p>
              <p className="font-medium text-ink mt-0.5 capitalize">
                {saharaResult.downstream.intentMatched ? "✅ Matched Intent" : "❌ Unmatched"}
              </p>
            </div>
            <div className="bg-paper p-3 rounded-lg border border-line/60">
              <p className="text-ink-muted font-mono text-[10px]">2. Extracted Concept</p>
              <p className="font-medium text-indigo font-mono mt-0.5 truncate">
                {saharaResult.downstream.predictedConceptId ?? "None"}
              </p>
            </div>
            <div className="bg-paper p-3 rounded-lg border border-line/60">
              <p className="text-ink-muted font-mono text-[10px]">3. Target Alignment</p>
              <p className="font-medium text-ink mt-0.5">
                {saharaResult.downstream.conceptMatched ? "✅ Exact Concept" : saharaResult.downstream.topicMatched ? `✅ Scope (${saharaResult.downstream.predictedTopic})` : "❌ Mismatched"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
