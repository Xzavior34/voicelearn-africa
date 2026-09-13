# VISUAL_REDESIGN_REPORT.md

## Scope of this pass

Frontend/visual/interaction only, as instructed. No changes to `lib/tutor/session.ts`,
`lib/tutor/curriculum.ts`, `lib/client/turnGuard.ts`, or any benchmark result file. One backend
file *was* touched — `lib/client/useSpeechRecorder.ts` — because the brief specifically required
the voice visual to react to *real* microphone state rather than fake it, and that recorder hook
had no notion of live audio amplitude to react to. That addition is described in detail below,
together with why it was necessary and what its blast radius is (it only adds a new field;
nothing existing was removed or changed in behavior).

## 1. Before-state problems (confirmed by reading the code, not assumed)

- The homepage hero was a static, non-interactive conversation mockup — no motion beyond a small
  status dot, no actual demonstration of the voice loop.
- The Learn page's microphone was a plain circular button with two CSS pulse rings and five
  waveform bars that animated on a fixed loop regardless of how loud (or whether) the learner was
  actually speaking — i.e., the "waveform" was decorative, not reactive.
- The "How it works" and subject-example sections rendered instantly with no scroll motion at
  all — informationally fine, but static.
- The navbar linked to `/progress`, a route that does not exist in `app/` — a real, previously
  undetected broken link.

## 2. Design direction

Kept, not replaced: the existing warm paper/ink palette, serif display type, and restrained
motion language were already well-aligned with "premium, warm, calm" — confirmed again this pass
by reading `app/globals.css` in full. The direction taken here was to make the *existing* system
demonstrably interactive rather than to introduce a new palette, new fonts, or a different visual
identity.

## 3. Components redesigned / added

- **`components/VoiceOrb.tsx` (new)** — a single reusable voice-interaction visual with 7 states
  (`idle`, `ready`, `listening`, `processing`, `responding`, `success`, `error`). It renders purely
  from props it's given; it has no internal timer or fake state of its own. Used in two places:
  - **`/learn`**: driven directly by the real `phase`/`recorder.status` state that already existed
    in `VoiceTutor.tsx` — replacing the old button + separate pulse-ring/waveform markup with one
    component, with no change to the underlying recording/submission logic.
  - **Homepage hero**: driven by a one-shot, clearly-labeled illustrative sequence (see below) —
    never presented as live recording.
- **`lib/client/useSpeechRecorder.ts` (extended, not rewritten)** — added a real `audioLevel`
  (0–1) field computed from the actual `MediaStream` via the native Web Audio API
  (`AudioContext`/`AnalyserNode`, polled with `requestAnimationFrame`). This is genuine amplitude
  metering, not a simulated value — it is 0 whenever not actually recording, and reflects real
  input level while recording. No new dependency was added; this uses only browser-native APIs.
  If Web Audio API construction fails for any reason, metering silently degrades to 0 and
  recording itself is unaffected — a cosmetic feature was never allowed to risk the core function.
  All existing return fields (`status`, `durationSeconds`, `errorMessage`, `start`, `stop`,
  `cancel`, `reset`) are unchanged.
- **`components/HeroVoiceDemo.tsx` (new)** — the homepage's illustrative voice-loop demonstration.
  Explicitly labeled "Illustrative example" in the UI itself (not just in a code comment), plays
  once (idle → listening → processing → responding, with the transcript revealing in sync), and
  does not loop indefinitely. Skips the animated sequence entirely under
  `prefers-reduced-motion`, settling immediately on the final state.
- **`components/RevealOnScroll.tsx` (new)** — a minimal `IntersectionObserver`-based reveal
  wrapper (no animation library added), applied to the "How it works" steps and the subject
  examples so they animate in with a staggered delay as the visitor scrolls, instead of appearing
  instantly. Starts fully visible (no animation) under `prefers-reduced-motion`, when
  `IntersectionObserver` is unsupported, or during server rendering.
- **Assessment feedback** — unchanged from the immediately prior pass (icon + text + color); not
  touched again here since it already satisfied "don't rely on color alone."
- **`components/Navbar.tsx`** — removed the dead `/progress` link (a real, previously undetected
  404 waiting to happen); no other structural changes, since it was already in good shape
  (working active-route styling, working mobile drawer, accessible labels).

## 4. Animations added

| Animation | Where | Driven by |
|---|---|---|
| Orb idle "breathing" ring | Homepage hero, Learn page (idle) | CSS keyframe, ambient only |
| Orb listening ring + waveform bars | Learn page | **Real microphone amplitude** (`audioLevel`) |
| Orb processing spin | Learn page, hero demo | CSS keyframe (calm, 3.6s rotation) |
| Assessment success settle | Learn page (already existed, unchanged) | CSS keyframe |
| Hero voice-loop playthrough | Homepage | JS-timed, one-shot, clearly labeled illustrative |
| Scroll reveal (how-it-works, subjects) | Homepage | `IntersectionObserver`, staggered delay |

All of the above resolve to an immediate, non-animated end state under
`prefers-reduced-motion` — the existing global CSS override (`animation-duration: 0.001ms`)
still applies to every CSS keyframe, and the two JS-driven components (`HeroVoiceDemo`,
`RevealOnScroll`) each independently check `matchMedia` and skip their JS timer/observer logic
entirely rather than relying only on the CSS override.

## 5. Mobile improvements

Carried over from the immediately prior pass (touch-target fixes on two secondary buttons) —
re-confirmed still in place, not re-done. No new mobile-specific work this pass beyond ensuring
the new components (`VoiceOrb`, `HeroVoiceDemo`, `RevealOnScroll`) use the same responsive
utility classes as the rest of the codebase and were sized to still fit inside the existing
mobile layout (the mic button remains ~96–115px including its rings, well above the 44px
minimum). **Not verified by actually rendering on a phone** — see Remaining Limitations.

## 6. Accessibility

- `VoiceOrb`'s decorative visuals are marked `aria-hidden="true"`; the actual accessible label and
  state (`aria-pressed`, `aria-label`) remain on the real `<button>` that wraps it in
  `VoiceTutor.tsx`, unchanged from before.
- `HeroVoiceDemo`'s animated reveal is inside the existing page flow, not interposed as a modal or
  focus trap; it makes no ARIA-live announcements (it's illustrative, not the real live
  conversation region, which already has its own `aria-live="polite"` on `/learn`, untouched).
- All reduced-motion handling described above is itself an accessibility improvement — the brief
  explicitly required animations not to run for visitors who've requested reduced motion, and
  this pass checked that explicitly for JS-driven motion, not just relied on the CSS override.

## 7. Performance

No new npm dependency was added anywhere in this pass. The only continuously-running work while
idle is two CSS keyframe animations (`animate-idle-breathe`, `orb-spin-slow`) and, while actually
recording, one `requestAnimationFrame` loop reading `AnalyserNode` data — which only runs during
an active recording session and is torn down (canceled, `AudioContext` closed) the moment
recording stops, via the same `cleanupStream` function that already existed. Not measured with
real profiling tools on an actual Android device — see Remaining Limitations.

## 8. Functional preservation

Confirmed, not assumed:
- `VoiceTutor.tsx`'s state machine, `submitTranscript`/`submitAudio` logic, `turnGuard`/
  `AbortController` wiring, and unmount safety are byte-for-byte unchanged except for the
  mic-button JSX being replaced with `<VoiceOrb>` inside the same `<button>` element with the same
  `onClick`/`disabled`/`aria-*` attributes.
- `useSpeechRecorder`'s existing behavior (permission flow, recording, stopping, error states) is
  unchanged; `audioLevel` is a pure addition that nothing else depends on being present.
- No changes anywhere to `lib/tutor/`, `lib/benchmark/`, or any `.json`/`.md` benchmark evidence
  file.

## 9. Tests

**110/110 before this pass, 110/110 after.** No test count change — this was a frontend/visual
pass and no new backend behavior was introduced that needed a new regression test; the one thing
that changed backend-adjacent (`useSpeechRecorder`'s new `audioLevel` field) is a browser-API
integration with no meaningful pure-function boundary to unit test in Node (it depends on
`AudioContext`/`MediaStream`, which don't exist in the Vitest/Node test environment) — covering it
would require adding a browser-based test harness, which is out of scope for a visual pass and was
not added.

`npm run typecheck` — clean. `npm run lint` — clean (including the newer
`react-hooks/set-state-in-effect` rule, which caught and required fixing a real issue in both new
client components during this pass — both were restructured to use lazy `useState` initializers
instead of setting state synchronously inside `useEffect`). `npm run build` — succeeds, same 8
routes.

## 10. Security

Re-swept the exact requested keyword list against `app/`, `components/`, `lib/`, `scripts/`:
clean, same result as every prior pass. The new files (`VoiceOrb.tsx`, `HeroVoiceDemo.tsx`,
`RevealOnScroll.tsx`) introduce no `dangerouslySetInnerHTML`, `eval`, `new Function`, or
`NEXT_PUBLIC_*` usage.

## 11. Screens requiring phone verification

Everything — no browser is available in this environment, so nothing visual in this pass has
been seen actually rendered, only reasoned about from source and confirmed to build/typecheck/
lint cleanly. Specifically worth checking on a real device (in addition to the existing
`ANDROID_TEST_CHECKLIST.md` items):

- Does the orb's listening state visibly react when you actually speak at different volumes?
- Does the hero's illustrative demo read clearly as an *example* and not as if it already
  understood a real thing you said?
- Does the scroll-reveal on the homepage feel smooth on a mid-range Android device, or does it
  stutter?
- Does turning on "remove animations" in Android accessibility settings actually stop the hero
  demo and scroll-reveal from animating (this pass added explicit JS-level checks for this, but
  it has not been confirmed against a real device's actual reduced-motion setting)?

## 12. Remaining limitations — named explicitly, not implied to be done

- **Per-segment code-switching visualization** (per the brief's "English / Pidgin / English"
  example) was **not** built. This is a deliberate, repeated decision across passes: the language
  detection pipeline (`describeLanguagePattern` in `lib/tutor/intent.ts`) only produces one label
  for a whole utterance — there is no real per-word/per-segment detection to visualize honestly.
  Building the visual without the underlying detection would mean fabricating segment boundaries.
- **About page** was not redesigned. It was reviewed and found to already be a deliberate,
  restrained editorial essay (not a disorganized "wall of prose") — a full visual-storytelling
  rebuild was judged lower-priority than the Learn page and homepage hero (which the brief
  explicitly said should get the most attention) given the scope of this pass, so it was left
  as-is rather than partially reworked.
- **Audio sample player with a real waveform** (brief section 13) was not built — the one real
  Sahara audio sample is not currently served to the frontend for playback, and building a
  waveform player without a real audio source to visualize would risk exactly the kind of
  fabricated-looking evidence this project has been careful to avoid throughout every prior pass.
- **No physical device or browser testing was performed.** Every claim in this report is backed
  by reading the source, and by `typecheck`/`lint`/`test`/`build` output — not by seeing the
  application actually render.

## Files changed this pass

New: `components/VoiceOrb.tsx`, `components/HeroVoiceDemo.tsx`, `components/RevealOnScroll.tsx`.
Modified: `lib/client/useSpeechRecorder.ts` (added `audioLevel`, additive only),
`components/VoiceTutor.tsx` (mic UI now renders `VoiceOrb`, no logic changes), `app/page.tsx`
(hero + two sections use the new components), `app/globals.css` (one new keyframe:
`orb-spin-slow`; `idle-breathe`/`success-settle` already existed from the prior pass),
`components/Navbar.tsx` (removed dead `/progress` link).

## STATUS

**READY FOR PHONE VERIFICATION.** Automated gates are clean (110/110 tests, typecheck, lint,
build). The three-model benchmark remains blocked (unchanged, out of scope for this pass) and no
physical device test has been performed — both stated plainly, not implied otherwise.
