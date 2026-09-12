# Responsible AI

## Privacy

Voice is sensitive, biometric-adjacent data.

- `/api/speech` processes audio in memory for a single request and does not persist it anywhere.
  There is no database, no file write, no logging of raw audio bytes in this codebase.
- If audio is ever stored for benchmarking or model improvement in a future iteration, that
  requires explicit, documented consent before any recording is retained — not implied by use of
  the app.
- Server logs must never include raw voice data or full transcripts of a learner's personal
  questions beyond what's needed for debugging; this build does not add any custom logging beyond
  Next.js defaults.

## Children

The product targets secondary-school learners, most of whom are minors.

- **No claim of child testing.** This build has not been tested with children, has no school
  pilot, and no learner outcomes data. See `COMPETITION_EVIDENCE.md` for exactly what is verified
  vs. proposed.
- **No unnecessary data collection.** The app does not ask for a name, age, school, or any
  personal identifier. Session state (`LearningSession`) exists only in the browser for the
  duration of a session — there is no learner account or profile.
- **No profiling or high-stakes decisions.** Difficulty adaptation only affects which practice
  question is asked next; nothing here informs grading, admissions, discipline, or any
  consequential decision about a learner.
- **Adult oversight for real deployment.** Any real classroom or school use should have a teacher
  or guardian aware of and able to review what the tool is doing — this is a design requirement
  for deployment, not something the current MVP enforces technically.

## Safety

VoiceLearn is scoped as an educational assistant only. It does not, and must not be extended to:

- make medical diagnoses
- make legal decisions
- determine school admission
- determine financial eligibility
- make disciplinary decisions

The curriculum is limited to three concepts (mathematics, science, English) precisely so the
system's scope stays legible and auditable.

## AI transparency

- The about page and README both state plainly: "VoiceLearn uses AI to assist learning and may
  occasionally misunderstand speech or educational context."
- Every failure path (speech recognition failure, network error, tutor error) gives the learner a
  clear recovery action rather than leaving them stuck — see Failure Handling below.
- The system never claims a numeric confidence score it hasn't actually computed — see
  `lib/tutor/schema.ts` (`confidence: number | null`) and `lib/tutor/intent.ts`, which returns
  `null` rather than inventing a plausible-looking number.

## Bias considerations

- The curriculum, trigger phrases, and misconception list were authored by the engineering team
  and reflect a Nigerian-Pidgin-first, Nigerian-curriculum-adjacent set of examples. They are not
  validated against a broader set of Nigerian English/Pidgin dialects or against non-Nigerian
  code-switching patterns (e.g. Kenyan Sheng, Ghanaian Pidgin) and should not be assumed to
  generalize there without further testing.
- The `codeSwitchPreservation` benchmark metric only tracks a fixed list of 13 Pidgin marker
  words (see `lib/benchmark/metrics.ts`); it is a proxy, not a comprehensive linguistic
  evaluation, and is documented as such in `BENCHMARK_METHODOLOGY.md`.

## Accessibility

- All interactive controls (mic button, text fallback input, example-prompt buttons, nav links)
  are real HTML buttons/links/inputs with visible focus states (see `:focus-visible` in
  `app/globals.css`), not `<div onClick>` patterns.
- A skip-to-content link is present for keyboard users (`app/layout.tsx`).
- The mic status text and error messages use `aria-live="polite"` / `role="alert"` so screen
  reader users get the same state updates as sighted users.
- Voice-first is not voice-only: every voice interaction has a typed-text equivalent path (the
  "type instead" fallback and the example-prompt buttons on `/learn`).
- `prefers-reduced-motion` is respected — the mic's listening-pulse animation is disabled for
  users who request reduced motion (`app/globals.css`).

## Failure handling

Every failure mode below has an explicit, tested path (see `app/api/speech/route.ts`,
`components/VoiceTutor.tsx`):

| Failure | Handling |
|---|---|
| Microphone permission denied | Clear message; typed-text fallback remains available |
| Empty/no audio captured | "We didn't catch any audio. Try again, or type your question below." |
| Sahara/API not configured | Explicit note that speech recognition isn't connected in this build, with a working typed-text fallback |
| Network failure calling `/api/speech` or `/api/tutor` | Explicit error message, no infinite "Processing…" state |
| Oversized or wrong-MIME audio upload | Rejected server-side with a clear 413/415 response before ever reaching a provider |
| Unrecognized topic (not in curriculum) | Explicit "I couldn't match that to a topic..." message, session state preserved, no crash |

## What we do not claim

Per the competition's non-negotiable rule against fabrication, this project does not claim: real
benchmark scores for any live model, a working deployment, real microphone testing on a physical
device, school pilots, learner outcomes, partnerships, or production readiness. See
`COMPETITION_EVIDENCE.md` for the full requirement-to-evidence matrix distinguishing VERIFIED from
REQUIRES_API_ACCESS from LOCAL_DEVICE_TEST_REQUIRED from FUTURE_WORK.
