# Architecture

## Data flow

```mermaid
flowchart LR
    A[Learner Voice] --> B[Audio Capture — MediaRecorder]
    B --> C[/api/speech]
    C --> D[Sahara provider]
    D --> E[Transcript]
    E --> F[/api/tutor]
    F --> G[Intent extraction — lib/tutor/intent.ts]
    G --> H[Tutor reasoning — lib/tutor/reasoning.ts]
    H --> I[Explanation + follow-up question]
    I --> J[Learner Voice Answer]
    J --> B
    J --> K[Assessment — lib/tutor/assessment.ts]
    K --> L[Adaptation — lib/tutor/adaptation.ts]
    L --> H
```

Where Sahara enters: `/api/speech` is the ONLY server route that calls a speech provider, and
`lib/speech/registry.ts` designates Sahara as `PRIMARY_PROVIDER`. Nothing downstream of the
transcript (`lib/tutor/*`) knows or cares which provider produced it.

## Module boundaries

```
app/
  page.tsx              — landing page
  learn/page.tsx         — the voice tutor UI (renders components/VoiceTutor.tsx)
  benchmark/page.tsx     — benchmark dashboard (server component, runs the benchmark live)
  about/page.tsx         — problem / responsible AI summary
  api/speech/route.ts    — ONLY place Sahara credentials are used; validates untrusted input
  api/speech/health/route.ts — real Sahara/provider authentication check (not just "configured")
  api/tutor/route.ts     — stateless tutor-turn endpoint

lib/
  speech/
    types.ts             — SpeechProvider interface, AudioInput, SpeechResult, SpeechProviderError, ProviderHealthResult
    registry.ts           — provider registry + PRIMARY_PROVIDER
    audio-conversion.ts   — dual-mode audio conversion: native pure-JS PCM extraction for 16kHz mono WAV, and ffmpeg transcoding for browser WebM/Opus
    providers/
      sahara.ts           — primary provider; real wss://infer.voice.intron.io/stt/v1/stream streaming contract (live authentication & protocol verified)
      model-b.ts          — comparison provider (REQUIRES_API_ACCESS)
      model-c.ts          — comparison provider (REQUIRES_API_ACCESS)
      generic-rest-provider.ts — shared factory for model-b/model-c

  tutor/
    curriculum.ts         — small hand-authored knowledge base + difficulty ladders
    schema.ts             — zod schemas: TutorResponse, LearningSession, AssessmentResult, etc.
    intent.ts             — stage 1: educational intent + topic extraction
    reasoning.ts          — stage 2: explanation + follow-up question generation
    assessment.ts         — stage 3: evaluates the learner's spoken answer
    adaptation.ts         — stage 4: updates difficulty/session state
    session.ts            — orchestrates stages 1-4 for one learner turn

  benchmark/
    dataset/              — 32 text-only development samples + zod schema
    metrics.ts             — WER, CER, code-switch preservation, lexical overlap (real algorithms)
    runner.ts              — ASR comparison + ground-truth intent-accuracy baseline
    reports/                — output of `npm run benchmark`

  client/
    useSpeechRecorder.ts   — real MediaRecorder wrapper (browser mic capture)

components/
  VoiceTutor.tsx           — client component: mic control, turn history, error/fallback states

scripts/
  run-benchmark.ts         — `npm run benchmark` entry point

__tests__/                 — 49 unit/integration tests (vitest: 47 passed, 2 host-ffmpeg dependent skipped)
```

## Why this separation

- **Speech vs. tutor**: any speech provider can be swapped without touching tutor logic, and the
  tutor pipeline can be fully tested (and was — 47 passing tests) without ever calling a live
  speech API, because it operates on plain transcript strings.
- **Four tutor stages, not one giant prompt/function**: each of intent extraction, reasoning,
  assessment, and adaptation is independently testable and independently replaceable (e.g. an
  LLM-backed reasoning engine could replace `reasoning.ts` alone, behind the same
  `TutorResponse` schema).
- **Server-only credentials**: `/api/speech` is the sole boundary where `SAHARA_API_KEY` is read;
  the browser only ever talks to `/api/speech` and `/api/tutor`, never to Sahara directly.
