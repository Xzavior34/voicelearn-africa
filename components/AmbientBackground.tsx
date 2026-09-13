/**
 * AmbientBackground — the "depth" layer for the dark visual identity.
 *
 * Three soft, blurred radial glows (indigo, violet, cyan), fixed behind
 * all page content. Purely decorative: `aria-hidden`, `pointer-events:
 * none`, and built from only `transform`/`opacity` so it stays
 * GPU-cheap and never triggers layout or paint on scroll. The single
 * slow drift animation is covered by the existing global
 * `prefers-reduced-motion` override (which zeroes all animation
 * durations), so no separate reduced-motion check is needed here — it
 * has no JS-driven motion of its own.
 *
 * This is a fixed, low-opacity layer, not a "giant gradient
 * background" — content readability is unaffected since it sits behind
 * solid card/page surfaces.
 */
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full opacity-[0.16] blur-[120px] animate-ambient-drift"
        style={{ background: "radial-gradient(circle, var(--indigo) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full opacity-[0.14] blur-[130px] animate-ambient-drift"
        style={{ background: "radial-gradient(circle, var(--ochre) 0%, transparent 70%)", animationDelay: "-9s" }}
      />
      <div
        className="absolute bottom-[-15%] left-1/4 h-[420px] w-[420px] rounded-full opacity-[0.10] blur-[130px] animate-ambient-drift"
        style={{ background: "radial-gradient(circle, var(--cyan) 0%, transparent 70%)", animationDelay: "-17s" }}
      />
    </div>
  );
}
