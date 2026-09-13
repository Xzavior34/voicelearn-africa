"use client";

import { JOURNEY_STEPS, JourneyStep } from "@/lib/client/learningStage";

const STEP_LABEL: Record<JourneyStep, string> = {
  understand: "Understand",
  try: "Try",
  check: "Check",
  master: "Master",
};

/**
 * The lesson journey — "navigation for the mind," not a progress bar.
 * Four steps, always shown by name (not just the current one), so the
 * learner can see the whole shape of where they are and where they're
 * headed. Purely presentational: it reads one `current: JourneyStep`
 * prop and has no state, timer, or animation loop of its own — the
 * mapping from real app state to this prop lives entirely in
 * `deriveJourneyStep()` (lib/client/learningStage.ts).
 *
 * Visual language, deliberately restrained:
 * - upcoming step: a quiet outline dot, muted label
 * - current step: a filled indigo dot with a soft ring glow and a very
 *   slow breathing halo (the same calm `animate-idle-breathe` keyframe
 *   used for the VoiceOrb's idle state elsewhere — one shared "calm"
 *   motion language, not a second animation system), bold label
 * - completed step: a small checkmark on a quiet success-tinted dot,
 *   muted label — "you already passed this," not a competing focal
 *   point
 *
 * `prefers-reduced-motion` is handled by the existing global CSS
 * override (zeroes all animation/transition durations); no separate
 * check is needed here since every transition in this component is a
 * plain CSS transition/animation, not JS-driven.
 */
export function JourneyIndicator({ current }: { current: JourneyStep }) {
  const currentIndex = JOURNEY_STEPS.indexOf(current);

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="status"
      aria-label={`Lesson step ${currentIndex + 1} of ${JOURNEY_STEPS.length}: ${STEP_LABEL[current]}`}
    >
      {/* Row 1: dots + connecting line — sized by content, so this row
          naturally determines the overall width the label row below
          aligns to. */}
      <div className="flex items-center">
        {JOURNEY_STEPS.map((step, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <div key={step} className="flex items-center">
              <span
                className={`relative flex items-center justify-center h-3.5 w-3.5 rounded-full transition-all duration-300 shrink-0 ${
                  isCurrent
                    ? "bg-indigo shadow-[0_0_0_3px_var(--indigo-light)]"
                    : isDone
                      ? "bg-leaf-light border border-leaf-border"
                      : "border border-line-dark bg-transparent"
                }`}
                aria-hidden="true"
              >
                {isCurrent && (
                  <span className="absolute inset-[-4px] rounded-full bg-indigo/20 animate-idle-breathe" />
                )}
                {isDone && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--leaf-dark)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              {i < JOURNEY_STEPS.length - 1 && (
                <span
                  className={`h-px w-5 sm:w-8 transition-colors duration-300 ${isDone ? "bg-leaf-border" : "bg-line"}`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Row 2: labels — evenly spaced across the same width the dot row
          occupies, so each label sits roughly under its dot without
          fragile pixel-offset math. */}
      <div className="flex items-center justify-between w-full">
        {JOURNEY_STEPS.map((step, i) => {
          const isCurrent = i === currentIndex;
          return (
            <span
              key={step}
              className={`flex-1 text-[10px] uppercase tracking-wider transition-colors duration-300 ${
                i === 0 ? "text-left" : i === JOURNEY_STEPS.length - 1 ? "text-right" : "text-center"
              } ${isCurrent ? "text-indigo font-semibold" : "text-ink-muted"}`}
            >
              {STEP_LABEL[step]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
