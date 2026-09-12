import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16 sm:py-24 flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-indigo-soft font-medium">Intron Sahara CodeSwitch Africa Challenge</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-ink">
          Learning should understand the learner,
          <br className="hidden sm:block" /> not force the learner to change how they speak.
        </h1>
        <p className="text-lg text-ink-soft leading-relaxed max-w-xl">
          Ask a question the way you would normally say it. VoiceLearn listens for what you mean,
          not just the words you use — starting with English and Nigerian Pidgin.
        </p>
      </div>

      <Link
        href="/learn"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo text-paper px-6 py-3 text-base font-medium hover:bg-indigo-soft transition-colors"
      >
        Start speaking
      </Link>

      <div className="border-t border-line pt-8 flex flex-col gap-4">
        <p className="text-sm uppercase tracking-wide text-ink-soft/70">How it works</p>
        <ol className="flex flex-col gap-3 text-ink-soft">
          <li><span className="text-ink font-medium">Speak</span> — ask a question naturally, mixing languages if that&apos;s how you&apos;d normally say it.</li>
          <li><span className="text-ink font-medium">Understand</span> — see exactly what VoiceLearn picked up as your topic and learning need.</li>
          <li><span className="text-ink font-medium">Teach & practise</span> — get an explanation, then a follow-up question to answer by voice.</li>
          <li><span className="text-ink font-medium">Adapt</span> — the next question depends on how you answered the last one.</li>
        </ol>
      </div>

      <p className="text-xs text-ink-soft/70 border-t border-line pt-6">
        VoiceLearn uses AI to assist learning and may occasionally misunderstand speech or educational
        context. See our <Link href="/about" className="underline hover:text-ink">Responsible AI notes</Link>.
      </p>
    </div>
  );
}
