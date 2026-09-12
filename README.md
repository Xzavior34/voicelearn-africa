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

## Sahara integration status (Live Authentication Verified)

The Sahara provider (`lib/speech/providers/sahara.ts`) implements the **real,
official streaming contract** from `https://docs.voice.intron.io/`:

- Endpoint: `wss://infer.voice.intron.io/stt/v1/stream`, `Authorization: Bearer <key>`
- Audio: PCM16LE, 16kHz, mono, base64, 1KB–32KB `INPUT_AUDIO_CHUNK` messages, terminated by `COMMIT`
- Protocols & Handshake: Server responds with `SESSION_CREATED` (session ID, credit balance) and `AUDIO_CHUNK_ACK` per chunk; final result read from `COMMITTED_TRANSCRIPT`.
- Documented error `message_type` handling: `AUTHENTICATION_ERROR`, `QUOTA_EXCEEDED`, `RESOURCE_EXHAUSTED`, `CHUNK_SIZE_TOO_SMALL/LARGE`, `INSUFFICIENT_AUDIO_ACTIVITY`, `SESSION_TIME_LIMIT_EXCEEDED` are handled explicitly and mapped to specific `SpeechProviderError` codes.

Audio conversion pipeline (`lib/speech/audio-conversion.ts`):
- Native pure-JS parser extracts PCM16 samples directly from canonical 16kHz 16-bit mono RIFF/WAV files with zero external dependencies.
- Browser-recorded compressed audio (webm/opus from `MediaRecorder`) is converted server-side to PCM16 mono/16kHz via `ffmpeg` when available on the server host.

**Live Status:**
- **Authentication Verified (Live)**: `npm run sahara:health` connects live to `wss://infer.voice.intron.io/stt/v1/stream`, authenticates the API key, and receives `SESSION_CREATED` with the active credit balance.
- **ASR WER/CER Benchmark (`AUDIO_DATASET_REQUIRED`)**: Measuring speech word error rates requires streaming physical voice recordings from consenting adult speakers. The benchmark runner processes audio files automatically when placed in the dataset.
- **Comparison Models B & C (`REQUIRES_API_ACCESS`)**: Swappable generic REST providers ready for credentials. No benchmark metrics are ever fabricated.

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

## Deployment & GitHub Repository

- **GitHub Repository**: [https://github.com/Xzavior34/voicelearn-africa](https://github.com/Xzavior34/voicelearn-africa)
- **Deployment Status**: Production-build verified (`npm run build` succeeds). The repository is pushed to GitHub and ready for self-deployment via GitHub integration on [Vercel](https://vercel.com) or any Node.js hosting platform (Render, Railway, Fly.io).
- **Environment Configuration**: Set `SAHARA_API_KEY` in your hosting dashboard's Environment Variables.
- **Audio Transcoding Architecture**: Uncompressed 16kHz 16-bit mono RIFF/WAV audio is decoded natively in pure TypeScript with zero external dependencies (ideal for serverless Vercel). For compressed browser recordings (`webm`/`opus`), `ffmpeg` must be present on the host (supported on container hosts or via custom serverless layers).

## Limitations & Honest Status

- **Sahara STT**: Authentication and WebSocket streaming protocol are verified live (`state: "authenticated"`). Speech WER/CER benchmark measurement is pending physical audio recordings from consenting speakers (`AUDIO_DATASET_REQUIRED`).
- **Mobile Microphone**: `MediaRecorder` audio capture is implemented and unit-tested; end-to-end verification on a physical smartphone browser requires a local device test (`LOCAL_DEVICE_TEST_REQUIRED`).
- **Comparison Models**: Model B and Model C generic REST providers are implemented and swappable; evaluation awaits API credentials (`REQUIRES_API_ACCESS`).
- **Curriculum Scope**: The curriculum covers three secondary-school concepts (signed multiplication, photosynthesis/chlorophyll, main idea identification) — intentionally focused per the challenge guidelines.
- **Tutor Reasoning**: Pedagogical reasoning is deterministic and rule-based, isolating the downstream educational intelligence and achieving a 79.3% baseline on ground-truth transcripts without non-deterministic LLM variance.

## Future Work

- Record 15–20 adult consented audio samples per the `DATASET.md` specification and run `npm run benchmark` to populate live WER/CER.
- Configure Model B (e.g. hosted Whisper) and Model C credentials to produce multi-model comparison metrics.
- Expand the curriculum beyond the initial three concepts once validated with real learners.
- Deploy an optional LLM-backed tutor reasoning engine behind the same `TutorResponse` zod schema.

## Team

Regamos Foundation.
