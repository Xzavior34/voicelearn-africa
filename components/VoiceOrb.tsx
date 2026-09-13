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
 */
export type VoiceOrbState =
  | "idle"
  | "ready"
  | "listening"
  | "processing"
  | "responding"
  | "success"
  | "error";

const STATE_LABEL: Record<VoiceOrbState, string> = {
  idle: "Ask anything you're learning about",
  ready: "Tap to speak",
  listening: "Listening — tap to finish",
  processing: "Understanding your question…",
  responding: "Here's how I'd explain it…",
  success: "Got it — nice work",
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
  size?: number;
}) {
  const ringScale = state === "listening" ? 1 + Math.min(audioLevel, 1) * 0.35 : 1;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer ambient rings — calm breathing at idle, amplitude-reactive while listening */}
      <span
        className={`absolute rounded-full transition-transform duration-150 ease-out ${
          state === "idle"
            ? "bg-leaf/10 animate-idle-breathe"
            : state === "listening"
              ? "bg-ochre/15"
              : state === "processing"
                ? "bg-indigo/12 orb-spin-slow"
                : state === "responding" || state === "success"
                  ? "bg-leaf/12"
                  : state === "error"
                    ? "bg-rust/10"
                    : "bg-indigo/10"
        }`}
        style={{
          width: size * 1.35,
          height: size * 1.35,
          transform: `scale(${ringScale})`,
        }}
      />
      <span
        className={`absolute rounded-full ${
          state === "listening" ? "listen-ring-1 bg-ochre/15" : ""
        }`}
        style={{ width: size * 1.15, height: size * 1.15 }}
      />

      {/* Core orb */}
      <div
        className={`relative z-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
          state === "listening"
            ? "bg-ochre text-paper"
            : state === "error"
              ? "bg-rust text-paper"
              : state === "success"
                ? "bg-leaf text-paper"
                : state === "processing"
                  ? "bg-indigo-soft text-paper"
                  : "bg-indigo text-paper"
        }`}
        style={{ width: size * 0.72, height: size * 0.72 }}
      >
        {state === "processing" ? (
          <svg className="animate-spin" width={size * 0.28} height={size * 0.28} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
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
          <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : state === "error" ? (
          <svg width={size * 0.28} height={size * 0.28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </div>
    </div>
  );
}
