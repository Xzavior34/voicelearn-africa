# LIGHT_PREMIUM_PALETTE_CONVERSION.md

## Scope actually delivered this pass, stated up front

This brief (and its near-identical duplicate) asks for an extremely large scope: a full palette
flip, a new learning-stage progress indicator, a subject-explorer redesign, a progress-page
"constellation," VoiceOrb glass/particle effects, and more. Given everything already built across
prior passes and the size of what's being asked here, this pass delivered the one change that is
both **most concretely specified** (exact hex values were given) and **highest-leverage** (the
app's semantic-token architecture means a `globals.css` swap cascades correctly to every route
without touching component logic) — the full conversion from the dark navy theme to the requested
light premium palette — plus two real bugs it surfaced along the way. Everything not done is
listed plainly in §14, not implied to be finished.

## 1. Exact files changed

- `app/globals.css` — every `:root` color token replaced with the requested light palette;
  `color-scheme: dark` → `light`.
- `components/HeroVoiceDemo.tsx` — a hardcoded shadow that baked in the *old* indigo as a literal
  `rgba(99,102,241,...)` (rather than referencing the `--indigo` variable) was replaced with a
  softer, `color-mix()`-based glow so it now tracks the new palette instead of silently keeping
  the previous theme's exact color baked into a shadow.
- `components/Navbar.tsx` — same category of bug: a `rgba(0,0,0,0.35)` heavy black elevation
  shadow (reasonable on a near-black background, too heavy on white) replaced with a softer
  two-layer neutral elevation shadow; two indigo glow shadows converted from opaque `var(--indigo)`
  to a `color-mix()` translucent version for a softer look on white, per the brief's explicit
  "very soft shadows" instruction.
- `app/page.tsx`, `app/progress/page.tsx` — same glow-shadow softening applied to the two other
  CTA buttons that referenced `var(--indigo)` directly as an opaque shadow color.

No other files were touched. `lib/tutor/`, `lib/benchmark/`, `lib/speech/`,
`lib/client/learningStage.ts`, `VoiceOrb.tsx`'s internal logic, the navbar's structure, and all
security/environment configuration are unchanged.

## 2. What visual system changed

The entire color foundation flipped from dark navy (`#070A14` background, near-white text) to the
exact light palette specified: background `#FAFBFF`, surface `#FFFFFF`, elevated surface
`#F5F7FC`/`#EEF1F7`, primary text `#111827`, secondary text `#667085`, muted text `#98A2B3`,
border `#E6EAF0`/`#D8DEE9`, indigo `#5B5CE2`, violet `#7C5CFC`, cyan `#22C7E8`, success `#16A34A`
(with a light `#ECFDF3` tint for success surfaces), error `#EF4444` (light tint `#FFF1F2`).
Because every component already consumed these as semantic Tailwind tokens (`bg-paper`,
`text-ink`, `border-line`, etc.) rather than literal Tailwind colors — re-confirmed by a grep that
found zero hardcoded `bg-white`/`bg-black`/`bg-gray-*` anywhere in `app/` or `components/`, same
as every prior palette-swap pass — this one file change cascades correctly across all 9 routes.
**Not added**: the brief's "mint" (`#20C997`) and "pink" (`#F472B6`) accent colors — nothing in
the current component set has a slot that uses them, and adding unused tokens (or inventing new
UI just to justify using them) would be decoration for its own sake, which the brief's own §54
("don't change things just because you can") argues against.

## 3. What interaction model changed

**Nothing.** This was explicitly a color/surface pass. `deriveLearningStage()`, the eight named
stages, `VoiceOrb`'s state logic, `turnGuard`, `initialPrompt`, topic switching, and every other
interaction behavior from the prior pass are byte-for-byte unchanged.

## 4. What was intentionally preserved

The entire tutor pipeline, Sahara integration, benchmark runner, turn-guard/AbortController
wiring, `deriveLearningStage`, the lesson trail, the fluid `clamp()`-sized VoiceOrb, and the
success/retry copy from the immediately prior pass — none of it was touched, per the brief's own
explicit instruction not to rebuild the architecture again.

## 5. Responsive decisions

None made this pass — the fluid `clamp(180px, 42vw, 320px)` orb sizing and existing responsive
layout from the prior pass are unchanged. A color swap doesn't change breakpoint behavior.

## 6. Accessibility decisions

The new palette was chosen to preserve (not just match) contrast: primary text `#111827` on
`#FAFBFF`/`#FFFFFF` gives a very high contrast ratio (comfortably AAA for body text); the indigo
`#5B5CE2` used for links/focus rings on white also clears WCAG AA for large text and UI
components. No contrast measurement tool was run in this environment to verify exact ratios
against small text specifically — this is a reasoned choice based on the hex values themselves,
not a tool-verified measurement, and is named as a gap rather than claimed as tested.

## 7. Motion decisions

Unchanged — no animation timing, easing, or trigger was touched this pass.

## 8. Functionality deliberately NOT fabricated

- No fake learner progress, streaks, XP, or mastery percentages were added to `/progress` — it
  remains the same honestly-labeled "Illustrative example" concept map from a prior pass (this
  build still has no persistence layer).
- No fake code-switching percentages (e.g. "63% English / 37% Pidgin") were added anywhere — the
  language note remains the same honest whole-utterance label it has always been.
- No new benchmark numbers, model statuses, or evidence were touched or invented.

## 9. Test result

**119/119 passing, unchanged.** A color/shadow pass touches no logic under test.

## 10. Typecheck result

**PASS** (`tsc --noEmit`, zero errors).

## 11. Lint result

**PASS** (`eslint .`, zero warnings/errors).

## 12. Build result

**PASS** (`next build`; same 9 routes; confirmed the `color-mix()` shadow values actually compiled
into the shipped CSS output, not silently dropped by Tailwind's arbitrary-value parser).

## 13. Security result

**PASS.** Re-swept `app/`, `components/`, `lib/`, `scripts/` for the full keyword list used in
every prior pass — zero matches outside server-only files, unchanged from every previous sweep.

## 14. Remaining limitations — named, not glossed over

This is the largest section, because this brief's scope was very large and only its
color-foundation portion was completed:

- **No "Understand → Try → Check → Master" progress indicator** was built (§11 of the brief).
- **No subject-explorer redesign** ("destinations" with symbols/taglines) beyond what already
  existed from an earlier pass (the homepage's glyph-accented subject list).
- **No "/progress" learning-constellation** (connected topic nodes) — it remains the simpler
  vertical concept-list from a prior pass, now just recolored for the light theme.
- **No VoiceOrb glass/translucent redesign or particle effects** — its structure, states, and
  fluid sizing are exactly as they were before this pass, just recolored.
- **No benchmark-page-specific "research lab" restyling** was done beyond the automatic palette
  cascade — it uses the same light tokens as the rest of the site rather than a deliberately
  distinct "scientific" surface treatment the brief asked for.
- **No mint/pink accent tokens added** (see §2).
- **A visual "5-second test" / "premium test" / any of the brief's qualitative acceptance
  criteria were not and cannot be evaluated from this environment** — see below.

## 15. Browser/device verification

**Not performed.** This sandbox has no display. Every claim above is backed by reading the actual
diffs, by `typecheck`/`lint`/`test`/`build` output, and by confirming all 9 routes return HTTP 200
against a live `next dev` server with no server-side rendering error — none of it is a substitute
for having seen the light theme actually rendered. I am explicitly not claiming "production ready"
or that the visual quality bar in this brief (premium, distinctive, not-a-Tailwind-template, etc.)
has been met — those are judgments only an actual rendered view, ideally on the stated Samsung S23
target, can settle.
