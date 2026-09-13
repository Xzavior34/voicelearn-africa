"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const PRIMARY_LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/progress", label: "Progress" },
  { href: "/about", label: "About" },
];

const SECONDARY_LINK = { href: "/benchmark", label: "Research" };

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 pt-3 sm:pt-4 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto rounded-2xl border border-line bg-paper-card/90 backdrop-blur-xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-8px_rgba(16,24,40,0.08)]">
        <div className="h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between">
          {/* Brand mark */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:rounded-lg"
          >
            <div className="h-8 w-8 rounded-lg bg-indigo flex items-center justify-center text-paper shadow-[0_0_14px_-3px_color-mix(in_srgb,var(--indigo)_55%,transparent)] group-hover:bg-indigo-soft transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <span className="font-display text-lg text-ink tracking-tight leading-none group-hover:text-indigo-soft transition-colors">
              Regamos <span className="font-medium text-ochre">VoiceLearn</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {PRIMARY_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive ? "bg-indigo-light text-indigo-soft" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={SECONDARY_LINK.href}
              className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${
                pathname === SECONDARY_LINK.href ? "bg-indigo-light text-indigo-soft font-medium" : "text-ink-muted hover:text-ink-soft"
              }`}
            >
              {SECONDARY_LINK.label}
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden sm:flex items-center">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-full bg-indigo text-paper px-4 py-2 text-sm font-medium hover:bg-indigo-soft transition-colors shadow-[0_0_16px_-4px_color-mix(in_srgb,var(--indigo)_55%,transparent)]"
            >
              Start learning
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/learn"
              className="inline-flex items-center rounded-full bg-indigo text-paper px-3 py-1.5 text-xs font-semibold"
            >
              Start
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-full text-ink-soft hover:text-ink hover:bg-paper-elevated"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line px-4 py-3 space-y-1 animate-fade-in">
            {[...PRIMARY_LINKS, SECONDARY_LINK].map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? "bg-indigo-light text-indigo-soft" : "text-ink hover:bg-paper-elevated"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
