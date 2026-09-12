"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/learn", label: "Voice Tutor", badge: "Interactive" },
    { href: "/benchmark", label: "Benchmark Console", badge: "3.6% WER" },
    { href: "/about", label: "About & Responsible AI" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:rounded-lg focus-visible:outline-indigo"
          >
            <div className="h-9 w-9 rounded-xl bg-indigo flex items-center justify-center text-paper shadow-xs group-hover:bg-indigo-soft transition-colors">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-semibold text-lg text-ink tracking-tight leading-none group-hover:text-indigo transition-colors">
                  Regamos <span className="font-serif italic font-normal text-ochre">VoiceLearn</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-light text-indigo border border-indigo-border/60">
                  Africa
                </span>
              </div>
              <span className="text-[10px] text-ink-muted font-medium mt-0.5">
                Intron Sahara Speech Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-indigo text-paper shadow-2xs font-semibold"
                    : "text-ink-soft hover:text-ink hover:bg-paper-elevated"
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? "bg-ochre text-paper"
                        : "bg-leaf-light text-leaf border border-leaf-border"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Status Pill */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper-subtle border border-line text-[11px] text-ink-soft font-medium">
            <span className="h-2 w-2 rounded-full bg-leaf animate-pulse" aria-hidden="true" />
            <span>Sahara WebSocket Live</span>
          </div>

          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo text-paper px-4 py-2 text-xs sm:text-sm font-medium hover:bg-indigo-soft transition-all shadow-xs active:scale-[0.98]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Start Learning</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/learn"
            className="inline-flex items-center rounded-lg bg-indigo text-paper px-3 py-1.5 text-xs font-semibold hover:bg-indigo-soft"
          >
            Start
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-paper-elevated focus-visible:outline-indigo"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-paper px-4 py-3 space-y-1 animate-fade-in shadow-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-indigo text-paper"
                    : "text-ink hover:bg-paper-elevated"
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? "bg-ochre text-paper" : "bg-leaf-light text-leaf"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted px-2 py-1">
            <span>Speech Engine: Intron Sahara</span>
            <span className="inline-flex items-center gap-1.5 text-leaf font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> Live Authenticated
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
