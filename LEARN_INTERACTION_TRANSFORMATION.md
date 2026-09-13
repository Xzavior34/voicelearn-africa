# LEARN_INTERACTION_TRANSFORMATION.md

Scope actually touched: `components/VoiceTutor.tsx`, `components/VoiceOrb.tsx`, one new file
(`lib/client/learningStage.ts`) and its test. Nothing else — `/`, `/progress`, `/benchmark`,
`/about`, the navbar, Sahara integration, the tutor pipeline, the benchmark runner, and security
configuration were not touched, per the strict scope rule.

## "/learn" transformation

### Before

The page was driven by two flat booleans (`isBusy`, `isRecording`) plus a `Phase` enum, and the
result of every turn was appended to a `history` array rendered as a scrolling list of
`TurnBlock`s — a right-aligned "learner" bubble, then an assessment line, then a left-aligned
"tutor" bubble containing the explanation and follow-up. Structurally, this was a chat transcript:
new turns appended below old ones, with the orb sitting above the growing thread as a static input
control that didn't visually distinguish "I'm listening" from "I'm thinking" from "I'm checking
your answer" — it collapsed to `idle`/`processing`/`ready` regardless of what kind of processing
or waiting was actually happening.

### After

A new pure function, `deriveLearningStage()`, computes one of eight named moments —
`curious | listening | understanding | teaching | assessing | success | retry | error` — from the
exact same real state that already existed (`phase`, `recorder.status`, `history`,
`session.topic`/`concept`, the latest turn's assessment outcome). This is presentation-layer only:
it doesn't change what gets sent to `/api/tutor`, how a turn is classified, or how assessment/
adaptation work — those are still entirely `lib/tutor/session.ts`'s job, untouched.

The page now renders around that stage instead of around a growing list:

- **`curious`** (no conversation yet): a real heading — "What are you curious about?" — plus a
  short invitation line, the orb, and tappable example pills ("try an example below") that submit
  directly, not a divided list of "curated prompts."
- **`listening` / `understanding` / `assessing`**: the orb's state and a matching heading
  ("Listening", "Understanding you", "Checking your thinking") both change together — the same
  wording appears as an `aria-hidden` heading for sighted users and inside the existing
  `aria-live="polite"` status region for screen readers, so a state change is always announced
  through text, never through orb color alone.
- **`teaching`**: only the *latest* turn is rendered as the dominant moment — "You asked" (the
  transcript, styled as a learner statement, not a chat bubble), the explanation in one clean
  block, then "Your turn" and the follow-up question. Earlier turns move into a collapsed,
  `<details>`-based **lesson trail** ("You asked —", "You practiced —"), which is deliberately
  terse and closed by default rather than a scrolling wall of bubbles.
- **`success` / `retry`**: the assessment feedback appears above the (still-visible) teaching
  content for that turn, with the existing icon+color+text treatment (unchanged from a prior
  pass) plus the matching heading ("You got it" / "Almost — let's look at it another way").
- **`error`**: unchanged behavior (existing `tutor_failed`/permission/network messaging), now also
  reflected in the stage label.

Topic switching, continuation, and answer-assessment classification are **completely unchanged**
— `new_topic` still clears stale state before this component ever sees the new turn, exactly as
before this pass. What's different is only that a topic switch now visually reads as "the
dominant moment replaced itself" (because only the latest turn renders prominently) rather than
"a new bubble was appended below the old one."

## Components changed

- **`components/VoiceTutor.tsx`** — render restructured (see above); `submitTranscript`,
  `submitAudio`, `handleMicPress`, `turnGuard`/`AbortController` wiring, unmount safety, and the
  `initialPrompt` auto-submit-once effect are **byte-for-byte unchanged** except for the stage
  derivation and JSX around them. `TurnBlock` was replaced by `CurrentMoment` (renders one turn,
  the dominant one) and a new `LessonTrail` (renders the rest, compactly). `AssessmentIcon` is
  unchanged, just reused from the new location.
- **`components/VoiceOrb.tsx`** — two new states added, `practice` and `assessing`, alongside the
  existing seven. `practice` reuses the existing mic icon with a cyan-tinted static ring (a calm
  invitation, distinct from `idle`'s green breathing ring); `assessing` uses a three-dot rhythmic
  pulse (not the generic spinner `processing` uses) so "checking your answer" reads as a distinct
  learning moment rather than a system-loading state, per the brief.
- **`lib/client/learningStage.ts` (new)** — the pure stage-derivation function described above.
- **`__tests__/learning-stage.test.ts` (new)** — 9 tests, one per stage transition, including the
  priority rule that a tutor/recorder error always wins even if the recorder is simultaneously
  "recording" or the phase would otherwise imply "assessing".

## Tests

**119/119** (110 baseline + 9 new `learning-stage` tests). No existing test was weakened, deleted,
or had its assertions loosened to make the suite pass. The 9 new tests exist because
`deriveLearningStage` is new, pure logic that didn't exist before — they directly cover the
interaction-test list requested (empty state → `curious`, mic → `listening`, processing a new
question vs. an answer → `understanding` vs. `assessing`, correct/incorrect → `success`/`retry`,
error priority). A few items from that requested list are **not** covered by a new automated
test, named honestly rather than glossed over:; see Limitations.

## Typecheck

**PASS** (`tsc --noEmit`, zero errors).

## Lint

**PASS** (`eslint .`, zero warnings/errors).

## Build

**PASS** (`next build`, Turbopack; 9 routes compiled, same set as before this pass — `/learn` was
already dynamic from the previous pass's `?prompt=` support).

## Security

**PASS.** Re-swept `app/`, `components/`, `lib/`, `scripts/` for the full keyword list used in
every prior pass (`SAHARA_API_KEY`, `INTRON`, `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`,
`NEXT_PUBLIC_`, `dangerouslySetInnerHTML`, `eval(`, `new Function(`) — zero matches outside
server-only files and documentation, unchanged from every previous sweep. Nothing in this pass
touches credentials, environment handling, or API routes.

## Browser rendering verification

**Browser rendering verification not performed.** This sandbox has no display. What was actually
verified: the real `next dev` server was started and `/learn`, `/learn?prompt=...`, and
`/progress` were confirmed to return HTTP 200, and a live `/api/tutor` sequence (multiplication →
evaporation topic switch) was re-run against the running server to confirm the underlying tutor
behavior this new UI sits on top of is unaffected. None of that is a substitute for actually
seeing the new interaction model rendered — that remains the genuine gap, same as every prior
pass.

## Remaining limitations — named, not glossed over

- **The teaching and practice moments are still delivered together**, not as two separately-timed
  states, because `/api/tutor` returns one `TutorResponse` containing both `explanation` and
  `followUpQuestion` in a single payload — there is no backend event for "explanation delivered"
  followed later by "now here's your challenge." Splitting them into a true two-step reveal would
  mean inventing a delay around data that already fully exists, which the brief itself warns
  against ("never distort the tutor's answer just to create animation"). What *does* happen: the
  explanation and the practice question are both shown as part of one `teaching` moment, laid out
  as two distinct labeled sections ("Let's break this down" content, then "Your turn").
- **No progressive step-by-step reveal of the explanation text** (e.g. animating a math sequence
  one line at a time) — `lib/tutor/reasoning.ts` returns one explanation string per topic, not a
  list of discrete steps, so there is nothing to reveal progressively without fabricating a
  step boundary that isn't really there.
- **Component-unmount and duplicate-submission-under-React-Strict-Mode were not covered by a new
  automated test** — both are exercised by the *existing* `turnGuard`/`isMountedRef` mechanisms
  (unchanged in this pass, already tested in `__tests__/turn-guard.test.ts` from a prior pass at
  the guard level), but a true DOM-level "does StrictMode double-invoke effects cause a duplicate
  request" test would require a React testing harness (jsdom + React Testing Library), which this
  project doesn't have and which I did not add, consistent with earlier passes' decision to avoid
  that new dependency.
- **The "lesson trail" is a `<details>` element**, not a custom animated collapsible — chosen
  deliberately for zero new JS, full keyboard/screen-reader support for free, and no new
  dependency, at the cost of a plainer open/close transition than a custom component would give.

## STATUS

**READY FOR PHONE VERIFICATION.** 119/119 tests, clean typecheck, clean lint, clean build, clean
security sweep. Browser rendering verification not performed — that remains the one thing only a
real device/browser can confirm.
