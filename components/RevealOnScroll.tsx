"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fades + lifts its children in once they scroll into view, using the
 * browser's native IntersectionObserver — no animation library added.
 * Reveals once (does not re-hide on scroll-out). Starts already-visible
 * (no animation) when the visitor prefers reduced motion, when
 * IntersectionObserver isn't supported, or during server rendering —
 * computed once via lazy initial state so no `setState` call happens
 * synchronously inside the effect body.
 */
export default function RevealOnScroll({
  children,
  delayMs = 0,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () => prefersReducedMotion() || typeof window === "undefined" || typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (visible) return; // already showing (reduced motion / unsupported / SSR-safe default)
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
