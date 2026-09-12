import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper-subtle/50 text-ink-soft text-sm mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand & Purpose */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-base text-ink tracking-tight">
                VoiceLearn <span className="text-ochre italic font-normal">Africa</span>
              </span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              &ldquo;Learning should understand the learner, not force the learner to change how they speak.&rdquo;
            </p>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              An intelligent voice-first educational tutoring system specifically engineered for African secondary-school multilingual code-switched speech.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-ink-soft">
              <span className="inline-block h-2 w-2 rounded-full bg-leaf" />
              <span>Regamos Foundation · Intron Sahara CodeSwitch Africa Challenge</span>
            </div>
          </div>

          {/* Column 2: Product & Experience */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs uppercase tracking-wider text-ink font-semibold">Experience</p>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/learn" className="text-ink-soft hover:text-indigo transition-colors">
                  Voice Tutor Console
                </Link>
              </li>
              <li>
                <Link href="/benchmark" className="text-ink-soft hover:text-indigo transition-colors">
                  Speech & Intent Benchmark
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-ink-soft hover:text-indigo transition-colors">
                  Pedagogical Architecture
                </Link>
              </li>
              <li>
                <Link href="/about#responsible-ai" className="text-ink-soft hover:text-indigo transition-colors">
                  Responsible AI Framework
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tech & Speech Engine */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs uppercase tracking-wider text-ink font-semibold">Intelligence</p>
            <ul className="flex flex-col gap-2 text-xs">
              <li className="text-ink-muted">
                Engine: <span className="text-ink font-medium">Intron Sahara STT</span>
              </li>
              <li className="text-ink-muted">
                Audio Pipeline: <span className="text-ink font-medium">PCM16 Mono 16kHz</span>
              </li>
              <li className="text-ink-muted">
                Languages: <span className="text-ink font-medium">English + Nigerian Pidgin</span>
              </li>
              <li className="text-ink-muted">
                Curriculum: <span className="text-ink font-medium">Math, Science, English</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Disclaimers & Ethics */}
        <div className="border-t border-line/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <p>
            Educational AI Disclosure: VoiceLearn is designed for low-stakes secondary revision practice, not formal examination grading. Audio is streamed in-memory and discarded.
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/about#safety" className="hover:text-ink transition-colors">
              Privacy & Safeguarding
            </Link>
            <span>·</span>
            <Link href="/benchmark" className="hover:text-ink transition-colors">
              Verified Evidence
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
