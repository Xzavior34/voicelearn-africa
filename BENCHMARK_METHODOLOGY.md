# Benchmark methodology

This document defines every metric used, exactly what it measures, and exactly what it does NOT
measure. Run `npm run benchmark` to reproduce all figures reported in `BENCHMARK_RESULTS.md`.

## What the benchmark currently can and cannot measure

This environment has **no audio recordings** (see `DATASET.md`) and **no live speech-provider
credentials** (see `.env.example`). That means:

| Can measure now | Cannot measure yet |
|---|---|
| Ground-truth intent/topic-extraction accuracy (text → tutor reasoning) | Real ASR accuracy (WER/CER) for Sahara or any comparison model |
| Metric function correctness (unit-tested on known text pairs) | Real code-switch preservation on actual model output |
| Tutor assessment/adaptation logic (full session-flow tests) | Real end-to-end latency |
| API failure handling (missing/oversized/wrong-type audio, unconfigured providers) | Anything requiring a physical microphone or real learner recordings |

## Part 1 — ASR comparison (Sahara / Model B / Model C)

**Method:** `lib/benchmark/runner.ts::runAsrComparison` calls each configured provider's
`transcribe()` for every dataset sample and compares the returned transcript to the sample's
`referenceTranscript` using the metrics below. If a provider has no credentials configured
(`SAHARA_API_URL`/`SAHARA_API_KEY`, etc. — see `.env.example`), it throws `REQUIRES_API_ACCESS`,
and the runner records that honestly rather than skipping the row or filling in a guess.

**Current status:** all three providers are unconfigured in this environment, so every sample
for every provider is `requires_api_access`. This is the correct, truthful output.

### Metrics (once live)

- **Word Error Rate (WER)** — Levenshtein edit distance over word tokens, normalized by reference
  word count. Implementation: `lib/benchmark/metrics.ts::wordErrorRate`. Standard ASR metric.
- **Character Error Rate (CER)** — same, over characters. `characterErrorRate`.
- **Code-switch preservation** — of the Pidgin marker words actually present in the reference
  (`dey`, `wetin`, `fit`, `abeg`, `sef`, `wey`, `sabi`, `na`, `go`, `don`, `wahala`, `gist`,
  `tire`), what fraction also appear in the hypothesis. `codeSwitchPreservation`. Returns `null`
  for samples with no Pidgin markers in the reference (not applicable). This is a proxy for
  "did the model silently formalize the learner's speech" — not a full linguistic evaluation.
- **Lexical overlap proxy** — Jaccard similarity over word sets. `lexicalOverlapProxy`. Explicitly
  labeled a proxy, not true semantic similarity — a genuine semantic-preservation metric would
  need embeddings or human judgment, neither available without an external model call in this
  environment.
- **Latency** — wall-clock milliseconds for the provider call, from `SpeechResult.latencyMs`.

## Part 2 — Educational understanding baseline (ground-truth transcripts)

**Method:** `runIntentAccuracyBaseline` runs `lib/tutor/intent.ts::extractIntent` directly against
each dataset sample's **hand-authored reference transcript** (bypassing ASR entirely) and checks
whether the predicted curriculum concept ID matches the sample's labeled
`expectedConceptId`. Only samples with `role: "initial_question"` are scored — `role:
"follow_up_answer"` samples (bare answers like "Twelve.") have no topic-identifying content of
their own and are excluded by design, not by cherry-picking after the fact (see `DATASET.md`).

**What this proves:** given perfect transcription, how accurately does the downstream educational
reasoning identify the right concept? It isolates the reasoning layer from ASR quality — useful
because it's the one part of the "does Sahara actually matter" question we can measure without
Sahara.

**What this does NOT prove:** it says nothing about Sahara's or any model's actual transcription
accuracy on code-switched audio. A model that mangles the transcript could still, in principle,
produce text this same intent extractor mishandles differently — that comparison requires real
audio and real ASR output, which is exactly Part 1 above, pending API access.

**Current result:** see `BENCHMARK_RESULTS.md` for the exact current figure (re-run
`npm run benchmark` to regenerate).

## Evaluation date & conditions

Every `npm run benchmark` run stamps the report with the current date
(`lib/benchmark/reports/SUMMARY-latest.md`). Conditions: Node.js, no network calls beyond
whatever a configured provider's URL requires; the intent baseline makes no network calls at all.
