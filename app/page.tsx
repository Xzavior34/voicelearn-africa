import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <section className="border-b border-line pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-6 flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.16em] text-ochre font-semibold">
                Voice-first learning
              </p>

              <h1 className="font-display text-3xl sm:text-5xl text-ink font-medium tracking-tight leading-[1.12]">
                Learn in the language that comes naturally.
              </h1>

              <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-xl">
                Regamos VoiceLearn is a voice-first learning companion that helps learners ask
                questions, understand difficult concepts, practise, and improve &mdash; naturally,
                in English and African code-switched speech.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/learn"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo text-paper px-6 py-3.5 text-sm sm:text-base font-medium hover:bg-indigo-soft transition-colors"
                >
                  Start learning
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm sm:text-base font-medium text-ink-soft hover:text-ink transition-colors"
                >
                  See how it works
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Conversation focal point */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-line bg-paper-card shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-3.5 border-b border-line flex items-center gap-2 text-xs text-ink-muted">
                  <span className="h-2 w-2 rounded-full bg-leaf" aria-hidden="true" />
                  <span>Learn console</span>
                </div>
                <div className="p-5 sm:p-6 flex flex-col gap-4">
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo text-paper px-4 py-2.5 text-sm sm:text-base leading-relaxed">
                      Why negative times negative go give positive?
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-paper-elevated px-4 py-2.5 text-sm sm:text-base text-ink leading-relaxed">
                      Think of multiplication as a repeated change in direction. A negative sign
                      flips your direction once &mdash; so two of them flip it twice, and you end
                      up facing positive again.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-ochre-border bg-ochre-light/50 px-4 py-2.5 text-xs sm:text-sm text-ink">
                      <span className="font-semibold text-ochre">Your turn &mdash; </span>
                      if &minus;4 &times; &minus;3, wetin you go get?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Why voice, why code-switching */}
      <section className="py-16 sm:py-24 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <h2 className="font-display text-2xl sm:text-3xl text-ink font-medium tracking-tight">
                African classrooms are multilingual. Most voice software is not.
              </h2>
              <p className="text-ink-soft text-sm sm:text-base leading-relaxed prose-measure">
                When a secondary-school learner struggles with a concept, they think and ask in
                the language that comes to them fastest &mdash; often a natural mix of English and
                Nigerian Pidgin. Speaking is easier and more immediate than typing, especially when
                you are stuck. But most speech software treats that natural mixing as an error to
                correct rather than a normal way of speaking.
              </p>
              <p className="text-ink-soft text-sm sm:text-base leading-relaxed prose-measure">
                Regamos VoiceLearn listens for what a learner means, not just the words they use,
                so asking a question never requires translating your thinking into formal English
                first.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-xl border-l-2 border-line-dark pl-5 py-1 flex flex-col gap-3">
                <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">A common voice assistant</p>
                <blockquote className="text-sm text-ink font-normal italic leading-relaxed">
                  &ldquo;Why negative times negative go give positive?&rdquo;
                </blockquote>
                <p className="text-sm text-ink-muted">&ldquo;Sorry, I didn&apos;t catch that. Please try standard English.&rdquo;</p>
              </div>
              <div className="rounded-xl border-l-2 border-leaf pl-5 py-1 flex flex-col gap-3">
                <p className="text-xs uppercase tracking-wider text-leaf font-semibold">Regamos VoiceLearn</p>
                <blockquote className="text-sm text-ink font-normal italic leading-relaxed">
                  &ldquo;Why negative times negative go give positive?&rdquo;
                </blockquote>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Understands the question, identifies signed multiplication as the concept, and
                  answers in plain, intuitive terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The learning cycle */}
      <section className="py-16 sm:py-24 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-soft font-semibold mb-2">How it works</p>
            <h2 className="font-display text-2xl sm:text-4xl text-ink font-medium tracking-tight">
              Ask, understand, practise, improve.
            </h2>
            <p className="text-ink-soft text-sm sm:text-base mt-3 leading-relaxed">
              Every conversation follows the same simple rhythm a good tutor uses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {[
              { n: 1, title: "Ask naturally", desc: "Speak freely in English, Nigerian Pidgin, or a natural mix of the two — the way you'd actually ask a friend." },
              { n: 2, title: "Understand the need", desc: "VoiceLearn identifies the subject and the concept behind the question, not just the words used." },
              { n: 3, title: "Explain clearly", desc: "A short, intuition-first explanation, calibrated to secondary-school level." },
              { n: 4, title: "Practise", desc: "A follow-up question checks whether the idea has landed, answered by speaking." },
              { n: 5, title: "Reflect", desc: "Answers are checked for common misconceptions, with encouraging, specific feedback." },
              { n: 6, title: "Improve", desc: "Difficulty adjusts up or down across five levels based on how the conversation is going." },
            ].map((step) => (
              <div key={step.n} className="flex flex-col gap-2">
                <span className="font-display text-sm text-ink-muted">{String(step.n).padStart(2, "0")}</span>
                <h3 className="font-display text-lg text-ink font-medium">{step.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Curriculum */}
      <section className="py-16 sm:py-24 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.16em] text-ochre font-semibold mb-2">What you can ask</p>
              <h2 className="font-display text-2xl sm:text-4xl text-ink font-medium tracking-tight">
                Secondary subjects, real questions
              </h2>
            </div>
            <Link href="/learn" className="text-sm font-medium text-indigo hover:text-indigo-soft underline underline-offset-4">
              Try it in the learn console &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { subject: "Mathematics", level: "JS3 / SS1", title: "Signed integer multiplication", q: "So if minus four times minus three, wetin I go get?" },
              { subject: "Biology", level: "JS2 / SS1", title: "Photosynthesis & chlorophyll", q: "Teacher talk say photosynthesis dey use light, but why chlorophyll dey absorb light like that?" },
              { subject: "English Language", level: "JS1–SS3", title: "Reading comprehension: main idea", q: "Every paragraph in this passage dey talk about different example, so wetin be the main idea?" },
            ].map((s) => (
              <div key={s.subject} className="flex flex-col gap-3 pt-5 border-t border-line">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{s.subject}</span>
                  <span className="text-ink-muted font-mono">{s.level}</span>
                </div>
                <h3 className="font-display text-base text-ink font-medium">{s.title}</h3>
                <p className="text-sm text-ink-soft italic leading-relaxed">&ldquo;{s.q}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Human element */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper-subtle/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.16em] text-leaf font-semibold mb-2">Built around real learning moments</p>
            <h2 className="font-display text-2xl sm:text-3xl text-ink font-medium tracking-tight">
              Learners shouldn&apos;t have to translate their thinking before they can ask for help.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <blockquote className="text-base sm:text-lg font-normal italic text-ink leading-relaxed border-l-2 border-line-dark pl-5">
              &ldquo;Why negative times negative go give positive?&rdquo;
            </blockquote>
            <blockquote className="text-base sm:text-lg font-normal italic text-ink leading-relaxed border-l-2 border-line-dark pl-5">
              &ldquo;I understand say chlorophyll dey important, but why exactly?&rdquo;
            </blockquote>
          </div>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed prose-measure">
            Both of these are genuine, well-formed questions. VoiceLearn is built so a learner
            never has to reword a question into formal English before getting help with it &mdash;
            the understanding happens on our side, not theirs.
          </p>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-5">
          <h2 className="font-display text-2xl sm:text-4xl text-ink font-medium tracking-tight">
            Ready to try it?
          </h2>
          <p className="text-ink-soft text-base max-w-xl">
            Ask a real mathematics, biology, or English question &mdash; by speaking, in whatever
            mix of English and Pidgin comes naturally.
          </p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo text-paper px-7 py-3.5 text-base font-medium hover:bg-indigo-soft transition-colors"
          >
            Start learning
          </Link>
          <p className="text-xs text-ink-muted max-w-lg pt-6 mt-2 border-t border-line/70">
            Voice audio is processed for live transcription and is not stored. Designed for
            low-stakes revision alongside a teacher, not in place of one.
          </p>
        </div>
      </section>
    </div>
  );
}
