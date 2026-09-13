"use client";

/**
 * VoiceOrb — the visual centerpiece of the voice interaction.
 *
 * This renders purely from the `state` and `audioLevel` props it's given —
 * it has no internal notion of "recording" or "listening" of its own. On
 * the Learn page, `audioLevel` is real, live microphone amplitude from
 * `useSpeechRecorder` (Web Audio API `AnalyserNode`, not a simulated
 * value); the orb's ring genuinely reacts to how loud you're speaking.
 * On the homepage, this component is used in `idle` state only, with no
 * audioLevel — its motion there is intentionally just calm ambient
 * breathing, not a fake "listening" demonstration.
 *
 * `size` accepts either a plain pixel number (for fixed contexts) or any
 * CSS length expression, including `clamp(...)` — every internal
 * dimension is computed with CSS `calc()` against that expression rather
 * than JS-multiplied pixel numbers, so passing a `clamp()` string makes
 * the whole orb (rings, core, and icons) genuinely fluid between a
 * mobile and a desktop size, not just the outer container.
 */
export type VoiceOrbState =
  | "idle"
  | "ready"
  | "listening"
  | "processing"
  | "responding"
  | "practice"
  | "assessing"
  | "success"
  | "error";

const STATE_LABEL: Record<VoiceOrbState, string> = {
  idle: "Tap and speak",
  ready: "Tap and speak",
  listening: "Listening — tap to finish",
  processing: "Understanding you…",
  responding: "Here's how to think about it…",
  practice: "Your turn",
  assessing: "Checking your thinking…",
  success: "You got it",
  error: "Let's try that again",
};

export function voiceOrbStatusLabel(state: VoiceOrbState): string {
  return STATE_LABEL[state];
}

export function VoiceOrb({
  state,
  audioLevel = 0,
  size = 96,
}: {
  state: VoiceOrbState;
  /** Real 0–1 microphone amplitude while listening. Ignored (and should
   * be omitted) for any state other than "listening". */
  audioLevel?: number;
  /** A pixel number, or any CSS length — pass a `clamp(...)` string for
   * fluid mobile-to-desktop sizing. */
  size?: number | string;
}) {
  const sizeExpr = typeof size === "number" ? `${size}px` : size;
  const scaled = (factor: number) => `calc(${sizeExpr} * ${factor})`;

  const ringScale = state === "listening" ? 1 + Math.min(audioLevel, 1) * 0.35 : 1;
  // "Understanding" draws inward (a slight contraction reads as the orb
  // "thinking"); a fresh teaching/practice moment settles back out to
  // full size. Both are subtle — this is a scale transform on top of
  // the ring's own scale, not a replacement for it.
  const coreBreath = state === "processing" ? 0.94 : state === "practice" ? 1.03 : 1;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: sizeExpr, height: sizeExpr }}
      aria-hidden="true"
    >
      {/* Outer ambient rings — calm breathing at idle, amplitude-reactive while listening */}
      <span
        className={`absolute rounded-full transition-transform duration-300 ease-out ${
          state === "idle"
            ? "bg-leaf/10 animate-idle-breathe"
            : state === "listening"
              ? "bg-cyan/18"
              : state === "processing"
                ? "bg-indigo/12 orb-spin-slow"
                : state === "assessing"
                  ? "bg-indigo/16 animate-idle-breathe"
                  : state === "practice"
                    ? "bg-cyan/12"
                    : state === "responding" || state === "success"
                      ? "bg-leaf/12"
                      : state === "error"
                        ? "bg-rust/10"
                        : "bg-indigo/10"
        }`}
        style={{
          width: scaled(1.35),
          height: scaled(1.35),
          transform: `scale(${ringScale})`,
        }}
      />
      <span
        className={`absolute rounded-full ${
          state === "listening" ? "listen-ring-1 bg-cyan/20" : ""
        }`}
        style={{ width: scaled(1.15), height: scaled(1.15) }}
      />

      {/* Core orb */}
      <div
        className={`relative z-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          state === "listening"
            ? "bg-cyan text-paper shadow-[0_0_24px_-2px_var(--cyan)]"
            : state === "error"
              ? "bg-rust text-paper"
              : state === "success"
                ? "bg-leaf text-paper"
                : state === "processing" || state === "assessing"
                  ? "bg-indigo-soft text-paper"
                  : state === "practice"
                    ? "bg-indigo text-paper shadow-[0_0_18px_-4px_var(--cyan)]"
                    : "bg-indigo text-paper"
        }`}
        style={{ width: scaled(0.72), height: scaled(0.72), transform: `scale(${coreBreath})` }}
      >
        {state === "processing" ? (
          <svg
            className="animate-spin"
            style={{ width: scaled(0.28), height: scaled(0.28) }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : state === "assessing" ? (
          // A rhythmic pulse, not a generic spinner — this is a learning
          // moment (checking an answer), not a system-loading state.
          <span className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ animationDelay: `${i * 0.15}s` }}
                className="h-1.5 w-1.5 rounded-full bg-paper animate-idle-breathe"
              />
            ))}
          </span>
        ) : state === "listening" ? (
          <span className="flex items-end gap-[3px] h-[38%]" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  animationDelay: `${i * 0.12}s`,
                  // Bars scale with real audio level, not a canned loop —
                  // the loop below still runs for shape/timing, but the
                  // baseline height genuinely reflects mic amplitude.
                  transform: `scaleY(${0.4 + Math.min(audioLevel, 1) * 0.6})`,
                }}
                className="w-[3px] h-full rounded-full bg-paper wave-bar origin-bottom"
              />
            ))}
          </span>
        ) : state === "success" ? (
          <svg
            style={{ width: scaled(0.3), height: scaled(0.3) }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : state === "error" ? (
          <svg
            style={{ width: scaled(0.28), height: scaled(0.28) }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            style={{ width: scaled(0.3), height: scaled(0.3) }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </div>
    </div>
  );
}
