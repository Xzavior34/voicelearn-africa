import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

/**
 * NOTE ON FONTS: this build uses a system font stack (see globals.css)
 * instead of next/font/google, because this development container's
 * network egress is restricted and cannot reach fonts.googleapis.com
 * (see network_configuration — only package registries are allowlisted).
 * The design is authored for Fraunces (display) + Plus Jakarta Sans
 * (body); swapping next/font/google back in is a one-line change in a
 * normal deployment environment with open internet access — see
 * README.md "Local Development" for the exact snippet.
 */

export const metadata: Metadata = {
  title: "VoiceLearn Africa",
  description:
    "Learning should understand the learner, not force the learner to change how they speak.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-indigo focus:text-paper focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <header className="border-b border-line">
          <nav className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="font-display text-lg tracking-tight text-ink">
              VoiceLearn <span className="text-indigo-soft italic">Africa</span>
            </Link>
            <div className="flex gap-5 text-sm text-ink-soft">
              <Link href="/learn" className="hover:text-ink transition-colors">Learn</Link>
              <Link href="/benchmark" className="hover:text-ink transition-colors">Benchmark</Link>
              <Link href="/about" className="hover:text-ink transition-colors">About</Link>
            </div>
          </nav>
        </header>
        <main id="main" className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="max-w-2xl mx-auto px-5 py-6 text-xs text-ink-soft">
            VoiceLearn Africa — a Regamos Foundation submission to the Intron Sahara CodeSwitch Africa Challenge.
          </div>
        </footer>
      </body>
    </html>
  );
}
