"use client";

import { useEffect, useState } from "react";
import { VoiceOrb, VoiceOrbState } from "@/components/VoiceOrb";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A one-shot, illustrative playthrough of the voice loop for the
 * homepage hero — clearly labeled as an example, not live user data or a
 * real transcription. Plays once on mount and settles on the final
 * state; does not loop indefinitely (kept restrained rather than
 * "always animating"). If the visitor has requested reduced motion, the
 * animated sequence never starts — the component's initial state is
 * already the settled end state (computed once via lazy `useState`
 * initializers, not via a `setState` call inside the effect body).
 */
export default function HeroVoiceDemo() {
  const [reducedMotion] = useState(prefersReducedMotion);
  const [orbState, setOrbState] = useState<VoiceOrbState>(() => (reducedMotion ? "responding" : "idle"));
  const [revealStep, setRevealStep] = useState(() => (reducedMotion ? 4 : 0));

  useEffect(() => {
    if (reducedMotion) return; // already settled on the final state, nothing to animate

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setOrbState("listening"), 900));
    timers.push(setTimeout(() => setRevealStep(1), 1300));
    timers.push(setTimeout(() => setOrbState("processing"), 2700));
    timers.push(setTimeout(() => setRevealStep(2), 3100));
    timers.push(setTimeout(() => setOrbState("responding"), 4100));
    timers.push(setTimeout(() => setRevealStep(3), 4400));
    timers.push(setTimeout(() => setRevealStep(4), 5600));

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  return (
    <div className="rounded-2xl border border-line bg-paper-card shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-3.5 border-b border-line flex items-center justify-between gap-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-leaf animate-idle-breathe" aria-hidden="true" />
          Learn console
        </span>
        <span className="text-[10px] uppercase tracking-wider text-ink-light">Illustrative example</span>
      </div>

      <div className="p-5 sm:p-6 flex flex-col items-center gap-5">
        <VoiceOrb state={orbState} size={72} />

        <div className="w-full flex flex-col gap-3 min-h-[132px]">
          {revealStep >= 1 && (
            <div className="flex justify-end animate-fade-in">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo text-paper px-4 py-2.5 text-sm sm:text-base leading-relaxed">
                Why negative times negative go give positive?
              </p>
            </div>
          )}
          {revealStep >= 2 && (
            <div className="flex justify-start animate-fade-in">
              <span className="text-[11px] text-ink-muted">Understanding &mdash; English + Nigerian Pidgin</span>
            </div>
          )}
          {revealStep >= 3 && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-paper-elevated px-4 py-2.5 text-sm sm:text-base text-ink leading-relaxed">
                Think of multiplication as a repeated change in direction. A negative sign flips
                your direction once &mdash; so two of them flip it twice, and you end up facing
                positive again.
              </div>
            </div>
          )}
          {revealStep >= 4 && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-ochre-border bg-ochre-light/50 px-4 py-2.5 text-xs sm:text-sm text-ink">
                <span className="font-semibold text-ochre">Your turn &mdash; </span>
                if &minus;4 &times; &minus;3, wetin you go get?
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
