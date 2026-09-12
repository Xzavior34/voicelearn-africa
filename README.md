# VoiceLearn Africa

Learning should understand the learner, not force the learner to change how they speak.

An adaptive voice-learning system for African secondary-school learners, built around Intron
Sahara's African code-switching speech intelligence. Submitted by the Regamos Foundation to the
Intron Sahara CodeSwitch Africa Challenge.

## Problem

African secondary-school learners naturally mix languages while asking questions — moving
between English and Nigerian Pidgin within a single sentence. Speech systems tuned for
standardized, monolingual speech routinely lose meaning exactly when a learner communicates the
way they actually would.

## Solution

VoiceLearn treats voice as the input to a full educational reasoning loop, not just a
transcription step:

```
Speak → Understand (code-switch aware) → Teach → Practise (voice answer) → Assess → Adapt
```

The tutor's next question depends on the learner's previous answer. This is the downstream task
the competition asks for — not speech-to-text alone.

## Why code-switching matters

A conventional voice assistant goes speech → text → answer, usually by quietly "correcting" mixed
speech into formal English before reasoning about it. VoiceLearn is built to preserve the
learner's actual communication pattern instead — see `lib/tutor/intent.ts` and the benchmark's
code-switch preservation metric in `lib/benchmark/metrics.ts`.

## Why Sahara

Sahara is the intended primary speech provider specifically because it targets African
code-switched speech, unlike general-purpose ASR models. See **Limitations** below for exactly
what is and isn't verified in this build.

## How it works

1. Learner presses the mic and speaks (or types, if speech recognition is unavailable — see
   below).
2. The transcript goes through `lib/tutor/intent.ts` (educational intent + topic extraction).
3. `lib/tutor/reasoning.ts` produces a structured, schema-validated explanation and follow-up
   question from a small hand-authored curriculum (`lib/tutor/curriculum.ts`).
4. The learner answers by voice; `lib/tutor/assessment.ts` evaluates the answer (not exact-text
   matching — it normalizes numerals, detects known misconceptions, and gives partial credit).
5. `lib/tutor/adaptation.ts` updates difficulty and session state; the next question is picked
   accordingly.

## Architecture

See `ARCHITECTURE.md` for the full diagram. In short:

```
Microphone → /api/speech (Sahara provider) → transcript
  → /api/tutor → intent → reasoning → assessment → adaptation → next question
```

Speech providers (`lib/speech/`) and tutor reasoning (`lib/tutor/`) are fully decoupled — either
side can be swapped without touching the other.

## Demo

See `DEMO_SCRIPT.md` for the full walkthrough. Quick path: run the app, go to `/learn`, and try
one of the example prompts shown on the page (or your own), e.g.:

> "Why negative times negative go give positive?"

Speech recognition itself requires Sahara credentials this build does not have (see below) — the
`/learn` page has a real microphone recorder, and if the speech call fails it honestly says so
and lets you type the transcript instead, so the full teach → practise → assess → adapt loop is
still genuinely exercisable end-to-end.

## Benchmark

`npm run benchmark` runs two things and writes results to `lib/benchmark/reports/`:

1. **ASR comparison** (Sahara vs. two comparison models) — currently reports `requires_api_access`
   for every provider (no live credentials in this environment). Not a placeholder: it's the
   honest output of code that would compute real WER/CER/latency the moment credentials exist.
2. **Educational understanding baseline** — runs the tutor's intent extraction directly against
   the dataset's ground-truth transcripts. This one is real and currently measured: **~79%**
   accuracy on initial-question samples (see `BENCHMARK_RESULTS.md` for the exact current figure
   and per-sample breakdown).

See `BENCHMARK_METHODOLOGY.md` for metric definitions and `DATASET.md` for dataset provenance.

## Evaluation methodology & results

See `BENCHMARK_METHODOLOGY.md` and `BENCHMARK_RESULTS.md`.

## Dataset

See `DATASET.md`. 32 hand-authored, text-only development samples — no audio recordings exist
yet (human or synthetic).

## Responsible AI

See `RESPONSIBLE_AI.md`.

## Sahara integration status (2026-09-12 update)

The Sahara provider (`lib/speech/providers/sahara.ts`) has been rewritten against the **real,
official streaming contract** from `https://docs.voice.intron.io/`:

- Endpoint: `wss://infer.voice.intron.io/stt/v1/stream`, `Authorization: Bearer <key>`
- Audio: PCM16LE, 16kHz, mono, base64, 1KB–32KB `INPUT_AUDIO_CHUNK` messages, terminated by `COMMIT`
- Final result read from `COMMITTED_TRANSCRIPT`; `SESSION_CREATED`, `PARTIAL_TRANSCRIPT`, and every
  documented error `message_type` (`AUTHENTICATION_ERROR`, `QUOTA_EXCEEDED`, `RESOURCE_EXHAUSTED`,
  `CHUNK_SIZE_TOO_SMALL/LARGE`, `INSUFFICIENT_AUDIO_ACTIVITY`, `SESSION_TIME_LIMIT_EXCEEDED`) are
  handled explicitly and mapped to a `SpeechProviderError` code (see `lib/speech/types.ts`)

Browser-recorded audio (webm/opus from `MediaRecorder`) is converted server-side to PCM16
mono/16kHz via `ffmpeg` (`lib/speech/audio-conversion.ts`) immediately before it's sent to
Sahara — this keeps the existing browser-side recording flow completely unchanged, and the
conversion pipeline itself is genuinely tested in this environment (see
`__tests__/audio-conversion.test.ts`, which spawns real `ffmpeg`-generated audio and verifies the
exact expected byte count).

**Still `REQUIRES_API_ACCESS` — not live.** No `SAHARA_API_KEY` exists in this development
environment, and separately, this sandbox's network egress does not include
`voice.intron.io` at all (confirmed: a direct request returns this environment's own proxy
403 with `x-deny-reason: host_not_allowed`, not a response from Sahara). Concretely, to make it
live **you** need to:

1. Add `SAHARA_API_KEY=<your real key>` to `.env.local` (never commit it, never paste it in chat).
2. Run this from a machine/environment with real internet access to `voice.intron.io` — this
   sandbox cannot reach it regardless of the key.
3. Run `npm run sahara:health` first — a fast, real auth check (~1s of silence) that reports
   `authenticated` / `auth_failed` / `quota_exceeded` / `unreachable` without running the full
   benchmark.
4. Once that passes, run `npm run benchmark` for real WER/CER/latency numbers, and update
   `BENCHMARK_RESULTS.md` with what it actually reports.

Two protocol details were not fully specified in the supplied docs and are implemented as
best-effort, clearly-flagged assumptions in `lib/speech/providers/sahara.ts` (search
`NOT YET VERIFIED`): how the four connection parameters are actually passed (implemented as query
parameters on the WS URL), and whether the server requires waiting for `SESSION_CREATED` before
the first audio chunk (implemented as: yes, with a 10s timeout). If a live session behaves
differently, those are the only two spots that need to change.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real credentials if you have them
npm run dev
```

Open http://localhost:3000.

### Restoring Google Fonts (Fraunces / Plus Jakarta Sans)

This repository ships with a system-font fallback because the environment it was built in has
restricted network egress and cannot reach `fonts.googleapis.com` at build time. If you're
building somewhere with normal internet access, restore the intended type system in
`app/layout.tsx`:

```tsx
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["500", "600"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400","500","600","700"] });
// add `${fraunces.variable} ${jakarta.variable}` to the <html> className
```

and update the `--font-display` / `--font-body` variables in `app/globals.css` back to
`var(--font-fraunces)` / `var(--font-jakarta)`.

## Environment variables

See `.env.example`. All speech-provider credentials are server-only — the browser never sees
`SAHARA_API_KEY` or any comparison-model key (see `app/api/speech/route.ts`).

## Deployment

**Not deployed.** This submission has been built, tested, and production-built
(`npm run build` succeeds) inside a sandboxed development container with no hosting access and
restricted network egress. Deploying to Vercel or any Node host is the standard next step —
nothing in the code assumes a specific host. See `COMPETITION_EVIDENCE.md` for what remains for
you to do after receiving this project.

## Limitations

- Sahara is not live in this build — no credentials were available. The integration is real,
  isolated, and honestly gated (see `lib/speech/providers/sahara.ts`).
- No physical microphone has been tested against this code from this environment — the
  MediaRecorder implementation is real, but needs a local device test.
- The curriculum covers exactly three concepts (signed multiplication, photosynthesis/chlorophyll,
  identifying a main idea) — intentionally narrow, per the challenge's own "depth beats breadth"
  guidance.
- Yoruba (Tier 2) is not enabled — support has not been verified against a real Sahara response.
- Tutor reasoning is deterministic/rule-based, not LLM-backed, so it is fully testable without
  external dependencies. An LLM-backed reasoning engine behind the same `TutorResponse` schema is
  a reasonable future upgrade (see Future Work).

## Future work

- Wire up real Sahara credentials and re-run `npm run benchmark` for live ASR figures.
- Record or source consented audio for the existing 32 transcripts (or a larger set) so
  code-switch preservation and WER can be measured against real speech, not just text.
- Expand the curriculum beyond three concepts once the core loop is validated with real users.
- Consider an LLM-backed tutor reasoning engine (behind the same schema) for broader topic
  coverage, gated the same way Sahara is — real credentials, honest failure states, no fabricated
  output.
- Teacher-facing oversight tooling for any real classroom deployment.

## Team

Regamos Foundation.
