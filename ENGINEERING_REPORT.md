# VoiceLearn Africa — Hardening Pass Report

## FILES CHANGED

- `lib/tutor/session.ts` — generalized turn-boundary classification (`classifyRelation` / `ConversationRelation`), replacing the earlier curriculum-dependent heuristic
- `lib/tutor/curriculum.ts` — 5 additional concepts (evaporation, friction/rolling, salt-dissolve, affect-effect, divide-by-zero) + their regex detectors (from the first pass, unchanged in this one)
- `lib/tutor/intent.ts` — updated "unrecognized topic" message text (first pass, unchanged in this one)
- `lib/client/turnGuard.ts` — **new**, minimal turn-identity guard
- `components/VoiceTutor.tsx` — wired `turnGuard` + `AbortController` into `submitTranscript`
- `__tests__/topic-switching.test.ts` — regression tests from the first pass
- `__tests__/conversation-relation.test.ts` — **new**, golden set for curriculum-independent relation classification
- `__tests__/turn-guard.test.ts` — **new**, deterministic race-condition test

## ROOT CAUSE (this pass)

The first fix used two signals to detect a topic switch: (a) a *different* curriculum concept matched, or (b) no concept matched but the text read as a question. Signal (a) is curriculum-dependent by construction, but signal (b) alone was not enough to correctly separate "new unrelated topic" from "legitimate continuation" — both are unmatched questions. The first pass had no way to tell "Why do clouds look white?" (new subject) apart from "Does it happen before boiling?" (continuation of the active topic) — both would have gone through the same "unrecognized new question" path.

## ARCHITECTURAL FIX

`classifyRelation(transcript, session, hasActiveTopic)` now returns an explicit `ConversationRelation`: `new_topic | continuation | answer_to_previous | ambiguous`. Curriculum concept matching is used only to *improve* the classification when available (a different matched concept is an unambiguous switch); it is **never required** to reach `new_topic`. For transcripts with no concept match, the classifier uses:

1. **Question structure** (question mark / interrogative starter) to separate answer-like text from questions.
2. **Anaphoric reference** (`it`, `this`, `that`, or a leading `so`/`and`/`also`/`then`/`but`) to separate a question that refers back to something already being discussed from one that introduces a new subject.
3. **Whether a topic is currently active**, which turns an anaphoric-but-unanchored question into `ambiguous` (no antecedent) rather than a false continuation.

A same-concept re-match (e.g. "So what's the difference between evaporation and boiling?" while evaporation is already active) is treated as `continuation`, not a restart, when it carries an anaphoric marker — this was caught and fixed after the first end-to-end run surfaced it misclassifying that exact demo-script step (see Browser Verification).

`new_topic` clears `topic`/`concept`/`difficulty`/`attempts`/`misconceptions` before reprocessing fresh (unchanged from the first pass). `ambiguous` returns a clarification result with no tutor response and no session mutation beyond logging the interaction.

## NEW TESTS

- `__tests__/conversation-relation.test.ts` (9 tests): the exact fixtures from the hardening request — new unknown topic (clouds/rainbow/metal/thunder), new known topic (evaporation), continuation (`Does it happen before boiling?` and the same-keyword continuation case), answer (`Forty-two.`, free-text explanatory answer), ambiguous (`Why does it happen?` with no active topic), plus a direct unit test of `classifyRelation`.
- `__tests__/turn-guard.test.ts` (4 tests): simulates request A starting, then B starting, B resolving first, A resolving later — asserts B stays active and A is rejected; plus non-overlap, supersession, and unknown-id cases.

## TEST RESULTS

| Metric | Before this pass | After this pass |
|---|---|---|
| Test files | 9 | 11 |
| Tests | 57 | **70**, all passing |

`npm test` → 70/70 passed. `npm run typecheck` → clean. `npm run lint` → clean. `npm run build` → succeeds (all 8 routes compiled).

## BROWSER VERIFICATION

**Not a browser/mobile UI test** — this sandbox has no display, so I did not drive the app through an actual browser, mic, or mobile viewport, and I am not claiming that. What I did verify: I started the real `next dev` server and sent real HTTP requests to the actual `/api/tutor` route (the same endpoint the UI calls), carrying session state forward exactly as the client does, for the full demo sequence plus an answer-assessment sequence:

| Turn | Input | Result (from the live server) |
|---|---|---|
| 1 | "Why do plants need sunlight for photosynthesis?" | `new_topic` → topic = Photosynthesis and chlorophyll |
| 2 | "What is evaporation?" | `new_topic` → topic = Evaporation (no chlorophyll contamination) |
| 3 | "Why water fit evaporate even when e never reach 100 degrees?" (code-switched) | recognized as evaporation, no stale response |
| 4 | "So what's the difference between evaporation and boiling?" | `continuation` → topic stayed Evaporation |
| 5 | "Why do clouds look white?" | `new_topic` → topic cleared, no tutor response, no stale contamination |
| A | "Why negative times negative go give positive?" | question asked, topic = signed multiplication |
| B | "Twelve." (correct) | `answer_to_previous`, outcome `correct`, difficulty 1→2 |
| C | "Negative twelve." (incorrect) | `answer_to_previous`, outcome `incorrect_misconception`, corrective feedback given |

This confirms the fix end-to-end through the real server, not just unit tests. What it does **not** cover: microphone permission flow, actual speech transcription, on-screen rendering, mobile layout/viewport, or accessibility — none of that can be exercised without a real browser, which this environment doesn't have.

## RACE-CONDITION STATUS

Implemented and tested, scoped minimally per the "no unnecessary complexity" instruction:

- `lib/client/turnGuard.ts`: hands out a monotonically increasing turn id; `isActiveTurn(id)` is only true for the most recently started turn.
- `VoiceTutor.tsx`: `submitTranscript` calls `startTurn()` before its fetch, aborts any previous in-flight request via `AbortController`, and checks `isActiveTurn` both right after the response headers arrive and after the body is parsed — a stale response is discarded at either point and never overwrites `session`/`history` state.
- `__tests__/turn-guard.test.ts` proves the exact scenario in the request (A starts, B starts, B resolves first, A resolves later → B stays active, A is rejected) deterministically, without depending on real network timing.

This is client-side request bookkeeping only — the `/api/tutor` route itself remains stateless and unchanged; no turn ID was added to the wire contract because the guard only needs to be known/checked on the client that owns the UI state.

## REMAINING LIMITATIONS

- **No true semantic topic-shift detection.** Classification is still surface-heuristic (question structure + anaphora + curriculum match), not embedding/LLM-based. A continuation phrased without any pronoun or connective ("Evaporation happens below boiling, right?" without "so"/"it") could still misclassify. This is a known ceiling of a fully deterministic, no-external-model design.
- **`ambiguous` only fires when there's no active topic at all.** With an active topic, an anaphoric question is always resolved as a continuation of that topic, even in principle-ambiguous cases with multiple candidate referents — the current single-active-concept session model has no representation of multiple simultaneous referents to be ambiguous between.
- **No full browser/mobile UI test was performed**, as stated above — only the real server's API layer was exercised.
- **No accessibility, security, or documentation audit was performed** in this pass (out of scope per "do not perform unrelated UI redesign or feature work").
- **Benchmark numbers, Model B/C status, and all existing Sahara evidence were left untouched** — no code in `lib/benchmark/` was modified, and no new performance, pilot, or evaluation claims are made anywhere.

## COMMIT HASH

None — the working copy was extracted from an uploaded zip, not a git checkout, so there is no repository to commit to or hash to report. All changed files are listed above and included in the delivered archive.
