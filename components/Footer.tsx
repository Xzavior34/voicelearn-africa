import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper-subtle/50 text-ink-soft text-sm mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-1 flex flex-col gap-3">
            <span className="font-display text-base text-ink tracking-tight">
              Regamos <span className="text-ochre italic font-normal">VoiceLearn</span>
            </span>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              A voice-first learning companion designed around how African secondary-school
              learners naturally speak — English, Nigerian Pidgin, and the fluid mix between them.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-xs uppercase tracking-wider text-ink font-semibold">Product</p>
            <ul className="flex flex-col gap-2 text-xs">
              <li><Link href="/learn" className="text-ink-soft hover:text-indigo transition-colors">Learn</Link></li>
              <li><Link href="/about" className="text-ink-soft hover:text-indigo transition-colors">About</Link></li>
              <li><Link href="/about#responsible" className="text-ink-soft hover:text-indigo transition-colors">Responsible by design</Link></li>
              <li><Link href="/benchmark" className="text-ink-soft hover:text-indigo transition-colors">Research &amp; evaluation</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-xs uppercase tracking-wider text-ink font-semibold">Languages supported</p>
            <ul className="flex flex-col gap-2 text-xs text-ink-muted">
              <li>English</li>
              <li>Nigerian Pidgin</li>
              <li>Natural code-switching between the two</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <p className="max-w-xl">
            VoiceLearn is a low-stakes revision companion designed for use alongside a teacher, not
            in place of one. Voice audio is processed for live transcription and is not stored.
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/about#responsible" className="hover:text-ink transition-colors">Safeguarding &amp; privacy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/benchmark" className="hover:text-ink transition-colors">Evaluation data</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
