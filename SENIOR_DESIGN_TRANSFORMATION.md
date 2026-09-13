# SENIOR_DESIGN_TRANSFORMATION.md

## Scope actually delivered this pass, stated up front

This brief's primary, explicit ask was the `JourneyIndicator` redesign — everything else (subject
exploration, progress-page constellation, benchmark TEST/COMPARE/MEASURE/DOCUMENT restructure) is
the same large scope carried over from the previous brief and was **not** attempted again this
pass, for the same reason as before: this environment's constraints mean depth on the stated
priority beats a shallow pass at everything. What follows is the `JourneyIndicator` redesign,
done properly, plus two smaller honest checks (success/retry copy, progress-page labeling) that
were reviewed and found already compliant rather than needing changes.

## 1. Exact files changed

- `components/JourneyIndicator.tsx` — fully rewritten (see below).
- No other file was touched. `lib/client/learningStage.ts`'s `deriveJourneyStep()` (from the
  prior pass) is consumed exactly as before with no signature or logic change.

## 2. Journey indicator changes

**Before:** four small dots and a connecting line, with only the *current* step's name shown as
text next to the row.

**After:**
- All four step names are always visible (`Understand · Try · Check · Master`), laid out in two
  aligned rows — dots+connectors on top, labels below — rather than a fragile single-row
  dot-plus-one-label layout. This was deliberately built as two rows instead of one to avoid a
  brittle pixel-offset hack for aligning labels under dots.
- **Completed steps** now show an actual checkmark icon on a quiet success-tinted (leaf/mint) dot,
  instead of just a smaller, darker version of the same indigo dot — "you already passed this" is
  now a distinct visual signal, not just a size difference.
- **The current step** has a filled indigo dot with a soft ring glow (`shadow` using
  `var(--indigo-light)`) and a very slow breathing halo — reusing the *existing*
  `animate-idle-breathe` keyframe already used for the VoiceOrb's idle state, deliberately, so the
  orb and the journey indicator share one calm motion vocabulary instead of introducing a second.
- **Upcoming steps** are a quiet outline dot with muted text.
- The connecting line between two steps is colored (leaf-tinted) only for the segment that is
  fully behind the current step, and plain gray otherwise — so the line visually "fills in" as the
  learner progresses, without ever coloring the segment ahead of where they actually are.
- `role="status"` with a text `aria-label` that names the step by position and name ("Lesson step
  2 of 4: Try") — a screen reader gets a real update every time this re-renders with a new
  `current` value, not just a decorative visual position.

**A real accessibility fix made during this redesign, not assumed away**: the initial draft used
`--ink-light` for upcoming-step labels, which I computed at 2.12:1 contrast against the page
background — clearly insufficient even accounting for WCAG's exemption for genuinely decorative/
inactive text, since these labels do convey real information (what's coming next). Changed
upcoming-step labels to use `--ink-muted` (the same token already verified at 4.55:1 in the prior
pass) instead, differentiating "done" from "upcoming" purely through the dot/checkmark treatment
rather than through a barely-legible color tier that existed only for this component.

## 3. Subject exploration changes

**None this pass.** Named honestly as not attempted, not glossed over.

## 4. Progress changes

**None.** Reviewed `/progress`'s existing "Illustrative example" disclosure against this brief's
suggested wording ("Illustrative learning map") — found it already substantively honest and
clear, and judged a cosmetic rewording not worth a file touch on its own. No new fabricated data
was added; none existed before.

## 5. Benchmark changes

**None this pass** — the dark research-lab surface from the prior pass is unchanged.

## 6. Mobile changes

**None specific to this pass.** The redesigned `JourneyIndicator` uses only relative sizing
(`flex-1`, `shrink-0`, small fixed dot/connector sizes in the 14–32px range) with no fixed-width
container of its own, so it should compress naturally at narrow widths — this is a reasoned
expectation from reading the markup, not a rendered/measured confirmation at 360–430px.

## 7. Accessibility changes

- Fixed the 2.12:1 contrast failure described above (found and fixed within this same pass, not
  carried over from before).
- `role="status"` + descriptive `aria-label` on the whole component (see above) — an improvement
  over the prior version's shorter label.
- All motion in the component is CSS transition/animation, so the existing global
  `prefers-reduced-motion` override (which zeroes all animation/transition durations) applies to
  it automatically — no separate JS-level check was needed, unlike the homepage's `HeroVoiceDemo`/
  `RevealOnScroll` from an earlier pass, which had to check `matchMedia` explicitly because they
  use JS timers/observers rather than pure CSS.

## 8. Tests added

**None new this pass.** `JourneyIndicator` is a pure presentational component with no logic of
its own beyond array indexing already exercised by the existing `deriveJourneyStep` tests from
the prior pass; there is no new pure-function boundary this redesign introduced that isn't already
covered by testing `deriveJourneyStep` directly.

## 9. Tests passing

**124/124, unchanged.**

## 10. Typecheck

**PASS.**

## 11. Lint

**PASS** (one unused variable the redesign introduced along the way — `isDone` in the label-row
map, made redundant once the label-color logic was simplified for the contrast fix above — was
caught by lint during this pass and removed before finishing, not left in).

## 12. Build

**PASS** (same 9 routes).

## 13. Security

**PASS** — same keyword sweep as every prior pass, clean.

## 14. Route smoke test

**PASS** — `/`, `/learn`, `/progress`, `/benchmark`, `/about` all returned HTTP 200 against a live
`next dev` server with no errors in the server log.

## 15. Anything intentionally NOT implemented

- Subject-exploration editorial redesign.
- Progress-page knowledge constellation (connected nodes).
- Benchmark page's TEST → COMPARE → MEASURE → DOCUMENT restructure.
- Any new micro-interaction beyond what `JourneyIndicator` itself needed.
- No fake data, streaks, XP, badges, or fabricated metrics were added anywhere, consistent with
  every prior pass.

## Browser/device visual verification not performed.

This sandbox has no display. Every claim above is backed by reading the actual diff, by
typecheck/lint/test/build output, by a live HTTP route smoke test, and — for the one
accessibility fix — by an actual computed contrast ratio. None of it is a substitute for having
seen the redesigned indicator actually render, and this should not be read as "production ready."
