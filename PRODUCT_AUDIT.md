# PRODUCT_AUDIT.md

Scope: `app/`, `components/`, `lib/`, `app/globals.css`, `public/`, `__tests__/`,
`lib/benchmark/`, and the project's own markdown docs. Performed by reading every relevant
source file and cross-checking documentation claims against the actual current code and test
output — not assuming a prior pass caught everything.

A note on the brief's premise: the brief describes the current app as "visually too plain,
document-like, and text-heavy." Having read `app/globals.css` and every page, that is only
partly true. There is already a deliberate, restrained editorial design system in place — a warm
paper/ink palette, a serif display font, calm (not flashy) listening-pulse and waveform
animations, reduced-motion support, and honest, precisely-labeled benchmark UI. The real gaps are
narrower than "no design exists": missing idle/alive motion, a few real accessibility and
staleness bugs, and some sections that are genuinely more text-dense than they need to be. This
audit reports what's actually there, not what the brief assumed was there.

---

## 1. Critical bugs (P0)

- **Stale hardcoded test count on the public benchmark page** — `app/benchmark/page.tsx` showed
  "50 / 50 passing automated tests" while the suite has grown to 109 (now 110). **Fixed.**
- **Stale hardcoded curriculum list in the unrecognized-topic fallback message** —
  `VoiceTutor.tsx` told learners the curriculum only covered 3 concepts (multiplication,
  photosynthesis, main idea) when it has grown to 9. A learner asking about evaporation or nouns
  and being told those aren't supported would be told something false. **Fixed** (in this and the
  prior pass).
- **Correctness communicated by color alone** — the assessment feedback (`correct` /
  `partially_correct` / `incorrect_misconception` / `incorrect_other`) was styled only with text
  color (green/amber/red/gray), no shape or icon cue. A color-blind sighted user has a
  meaningfully harder time distinguishing "correct" from "partially correct" than a
  fully-sighted user. **Fixed** — added a shape-based icon (check / dash / cross) alongside the
  existing color and text.

## 2. Functional weaknesses (P1)

- The relation classifier is a deterministic heuristic (question structure + anaphora + explicit
  abandon phrases + curriculum matching), not semantic — this is a known, documented limitation
  from prior passes, not new. No change made here; re-flagging it because "functional weakness"
  is exactly what it is, even though it's already covered by a 34-case golden corpus.
- Session state does not persist across a page refresh (by design, not a bug — but worth stating
  plainly rather than letting it surface as a surprise during phone testing; documented in
  `ANDROID_TEST_CHECKLIST.md`'s refresh test).

## 3. UX weaknesses (P1/P2)

- **P1 — Secondary buttons had touch targets well under the 44×44px minimum** ("Start over", "Or
  type instead" were plain underlined text with no padding). **Fixed** — both now have a minimum
  44px tap height via padding, with a matching negative margin so the visual size/position is
  unchanged.
- **P2 — The homepage hero was visually static** — a real conversation mockup, but nothing in it
  moved until you scrolled to the recording UI on `/learn`. **Fixed, narrowly** — the hero's
  status dot now has a slow, restrained "breathing" opacity animation (respects
  `prefers-reduced-motion`, already globally handled). This is a small, honest improvement, not
  the full animated "listening orb" the brief envisions (see Remaining Limitations).
- **P2 — Code-switching is only ever shown as a whole-utterance label** ("Mixed English +
  Nigerian Pidgin"), never as inline per-segment highlighting. This was a deliberate choice, not
  an oversight: the language-detection pipeline (`describeLanguagePattern` in
  `lib/tutor/intent.ts`) only produces one label per utterance — it has no per-word/per-segment
  detection to visualize truthfully. Building a per-segment UI would require either fabricating
  segment boundaries that aren't actually detected, or building genuine token-level code-switch
  detection (a real NLP feature, out of scope for a UI pass). Left as the honest whole-utterance
  label rather than faked segmentation.

## 4. Visual weaknesses (P2)

- Largely already addressed by the existing design system (see note above). The most legitimate
  remaining gap is that the "hero visually demonstrates the product" ask from the brief (an
  interactive idle-animating voice orb/waveform) is not implemented — the hero still shows a
  static example conversation, now with one small live animation, not a live interactive demo.
  This is named explicitly under Remaining Limitations rather than implied to be done.

## 5. Accessibility weaknesses (P1 — fixed this pass)

- No `aria-live` region on the conversation stream (fixed in the previous pass).
- Assessment correctness communicated by color alone (fixed this pass, see above).
- Touch targets under 44px on two secondary buttons (fixed this pass, see above).
- Not re-audited this pass: actual screen-reader behavior (TalkBack/VoiceOver) was not run against
  the live app — no assistive-technology software is available in this environment. This remains
  a real gap, named under Remaining Limitations, not silently dropped.

## 6. Mobile weaknesses (P1/P2)

- No changes made for `env(safe-area-inset-*)` — considered and deliberately **not** added:
  the specified target device is a Samsung Android phone in Chrome, where Android's system
  navigation is already accounted for in normal document flow; `env(safe-area-inset-*)` is
  primarily an iOS-notch concern that doesn't apply the same way here. Adding it would be
  speculative CSS for a device that isn't the actual target, so it was skipped rather than
  included for appearance's sake.
- Mic button (80–96px) and manual-input submit button already meet or exceed the 44px minimum;
  the two under-sized secondary buttons are fixed (see above).
- No horizontal-overflow issue was found by reading the layout code (all containers use
  `max-w-*`/`px-4 sm:px-6` responsive padding consistently) — this is a static read, not a
  rendered-viewport test; actual rendering at 360/375/390/412px has not been visually confirmed
  (no browser available here).

## 7. Performance weaknesses (P2)

- No large dependencies, background video, or canvas-based animation exist anywhere in the
  codebase — all motion is CSS transitions/keyframes. No performance concern identified from
  static reading. Not measured with real profiling tools (no browser available here).

## 8. Security weaknesses

- None found. Fresh sweep against the exact requested keyword list
  (`SAHARA_API_KEY`, `INTRON`, `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `NEXT_PUBLIC_`,
  `dangerouslySetInnerHTML`, `eval(`, `new Function(`) against `app/`, `components/`, `lib/`,
  `scripts/` (excluding build artifacts and documentation) returned zero matches for any of the
  code-injection patterns, and confirmed all credential references are server-only.

## 9. Evidence-integrity weaknesses (P0 — fixed)

- The two stale-count bugs under "Critical bugs" above are evidence-integrity issues as much as
  functional ones — a visitor reading "50/50 tests" while the real number was 109 is being shown
  inaccurate evidence, even though nobody intended to fabricate anything. Fixed.
- `DATASET.md` previously claimed the benchmark dataset "matches" the current curriculum; the
  curriculum has grown to 9 concepts while the dataset still only covers the original 3. Fixed in
  a prior pass — re-confirmed still accurate in this audit.

## 10. Submission risks

- The single largest remaining risk to a strong submission is that **no real browser or physical
  device test has been performed** — everything above was verified by reading source, running the
  automated test suite, and (in a prior pass) hitting the live API server directly over HTTP. A
  judge opening the actual deployed site on their own phone is the first real end-to-end test of
  the rendered UI, and that hasn't happened yet in this environment.
- A secondary risk: the visual/interaction work in this pass is real but intentionally bounded
  (icon-based assessment feedback, touch-target fixes, one idle animation) rather than the full
  "Duolingo × premium voice assistant" hero redesign described in the brief. Overclaiming that
  full redesign happened would itself become a new evidence-integrity problem — so it's reported
  honestly as partial, with the specific gap named, rather than glossed over.
