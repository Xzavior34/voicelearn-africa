import Link from "next/link";
import Image from "next/image";
import HeroVoiceDemo from "@/components/HeroVoiceDemo";
import RevealOnScroll from "@/components/RevealOnScroll";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-light text-cyan text-xs font-semibold w-fit border border-indigo-border/60">
                <span className="h-2 w-2 rounded-full bg-leaf animate-pulse" aria-hidden="true" />
                <span>Voice-First African Pedagogy</span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl text-ink font-semibold tracking-tight leading-[1.05]">
                Learn in the language that comes naturally.
              </h1>

              <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-xl">
                Speak the way you actually think — in English, Nigerian Pidgin, or a natural mix
                of both. VoiceLearn understands, explains, and adapts as you go.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/learn"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo text-paper px-6 py-3.5 text-sm sm:text-base font-medium hover:bg-indigo-soft transition-all shadow-[0_0_22px_-6px_color-mix(in_srgb,var(--indigo)_55%,transparent)] active:scale-[0.98]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                  <span>Start Learning</span>
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm sm:text-base font-medium text-ink-soft hover:text-ink transition-colors"
                >
                  <span>See How It Works</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Voice interaction demonstration */}
            <div className="lg:col-span-6">
              <HeroVoiceDemo />
            </div>
          </div>

          {/* Try it — real, tappable prompts */}
          <div className="mt-12 sm:mt-16">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted font-semibold mb-4">
              Try asking directly
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                { prompt: "Why negative times negative dey give positive?", subject: "Math" },
                { prompt: "Why do plants need sunlight?", subject: "Science" },
                { prompt: "Wetin be evaporation?", subject: "Science" },
                { prompt: "What's the difference between affect and effect?", subject: "English" },
              ].map((item) => (
                <Link
                  key={item.prompt}
                  href={`/learn?prompt=${encodeURIComponent(item.prompt)}`}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-paper-card/70 px-4 py-2.5 text-sm text-ink-soft hover:text-ink hover:border-indigo-border hover:bg-indigo-light transition-all shadow-2xs"
                >
                  <span className="text-[11px] font-semibold text-indigo font-mono bg-paper px-2 py-0.5 rounded-full border border-line">{item.subject}</span>
                  <span>&ldquo;{item.prompt}&rdquo;</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-light group-hover:text-cyan transition-colors shrink-0" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Storytelling & The Code-Switching Reality */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper-subtle/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Visual Editorial Image */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative rounded-3xl overflow-hidden border border-line shadow-sm group">
                <Image
                  src="/images/hero-learner.jpg"
                  alt="Secondary school learner in West Africa asking academic questions through VoiceLearn voice tutor"
                  width={640}
                  height={360}
                  className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <span className="font-medium">Regamos Royal Academy Context</span>
                  <span className="text-[11px] text-ochre font-semibold">Natural Code-Switching</span>
                </div>
              </div>
              <p className="text-[11px] text-ink-muted text-center italic">
                Designed for secondary-school learners in multilingual classroom environments.
              </p>
            </div>

            {/* Narrative & Dialogue Comparison */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-ochre font-bold mb-2">The Classroom Reality</p>
                <h2 className="font-display text-2xl sm:text-4xl text-ink font-semibold tracking-tight">
                  African classrooms are multilingual. Voice assistants should be too.
                </h2>
              </div>
              <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
                When a secondary-school learner struggles with a concept, they think and ask in
                the language that comes to them fastest &mdash; often a natural mix of English and
                Nigerian Pidgin. Conventional speech engines reject or mishear this natural speech. VoiceLearn listens for underlying meaning.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-rust-border/70 bg-rust-light/30 p-5 flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rust">Conventional Voice AI</span>
                  <blockquote className="text-xs sm:text-sm text-ink font-serif italic bg-paper-card p-3 rounded-xl border border-line">
                    &ldquo;Why negative times negative go give positive?&rdquo;
                  </blockquote>
                  <p className="text-xs text-rust font-medium">&ldquo;I didn&apos;t catch that. Please speak standard English.&rdquo;</p>
                </div>

                <div className="rounded-2xl border border-leaf-border/70 bg-leaf-light/30 p-5 flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-leaf">VoiceLearn Africa</span>
                  <blockquote className="text-xs sm:text-sm text-ink font-serif italic bg-paper-card p-3 rounded-xl border border-line">
                    &ldquo;Why negative times negative go give positive?&rdquo;
                  </blockquote>
                  <p className="text-xs text-leaf-dark font-medium leading-relaxed">
                    Identifies signed multiplication, breaks down the number pattern, and guides active recall.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 6-Step Voice Learning Cycle */}
      <section className="py-16 sm:py-24 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo font-bold mb-2">Pedagogical Rhythm</p>
            <h2 className="font-display text-2xl sm:text-4xl text-ink font-semibold tracking-tight">
              Ask, understand, practise, adapt.
            </h2>
            <p className="text-ink-soft text-sm sm:text-base mt-2 leading-relaxed">
              Every conversation follows the authentic rhythm of an expert human tutor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { n: 1, title: "Ask naturally", desc: "Speak freely in English, Nigerian Pidgin, or mixed code-switching — the way you'd ask a friend." },
              { n: 2, title: "Understand the need", desc: "VoiceLearn identifies the topic and learning intent (conceptual, procedural, or clarification)." },
              { n: 3, title: "Explain clearly", desc: "Delivers an intuition-first breakdown calibrated to West African secondary curriculum." },
              { n: 4, title: "Targeted practise", desc: "Presents a focused check challenge that the learner solves by speaking." },
              { n: 5, title: "Diagnose thinking", desc: "Evaluates answers for known misconceptions with encouraging coaching." },
              { n: 6, title: "Adaptive ladder", desc: "Difficulty dynamically steps up or down across a 5-level mastery progression." },
            ].map((step) => (
              <RevealOnScroll key={step.n} delayMs={(step.n - 1) * 60}>
                <div className="rounded-2xl border border-line bg-paper-card/60 p-6 flex flex-col gap-3 hover:border-indigo-border/60 transition-all shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo text-paper font-display text-sm font-semibold">
                      {String(step.n).padStart(2, "0")}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted">Stage {step.n}</span>
                  </div>
                  <h3 className="font-display text-lg text-ink font-semibold mt-1">{step.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{step.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Curriculum Subjects */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper-subtle/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.16em] text-ochre font-bold mb-2">Curriculum Breadth</p>
              <h2 className="font-display text-2xl sm:text-4xl text-ink font-semibold tracking-tight">
                Secondary Subjects Built for Real Questions
              </h2>
            </div>
            <Link href="/learn" className="text-sm font-semibold text-indigo hover:text-indigo-soft underline underline-offset-4">
              Open Voice Tutor &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { subject: "Mathematics", badge: "bg-indigo-light text-indigo", level: "JS3 / SS1", title: "Signed Integer Multiplication", q: "So if minus four times minus three, wetin I go get?" },
              { subject: "Biology / Science", badge: "bg-leaf-light text-leaf", level: "JS2 / SS1", title: "Photosynthesis & Chlorophyll", q: "Teacher talk say photosynthesis dey use light, but why chlorophyll dey absorb light like that?" },
              { subject: "English Language", badge: "bg-ochre-light text-ochre", level: "JS1 – SS3", title: "Reading Comprehension: Main Idea", q: "Every paragraph in this passage dey talk about different example, so wetin be the main idea?" },
            ].map((s) => (
              <RevealOnScroll key={s.subject} delayMs={0}>
                <div className="rounded-3xl border border-line bg-paper-card p-6 flex flex-col justify-between gap-4 shadow-2xs hover:border-indigo-border/60 transition-all h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full font-semibold text-xs ${s.badge}`}>{s.subject}</span>
                      <span className="text-xs text-ink-muted font-mono">{s.level}</span>
                    </div>
                    <h3 className="font-display text-lg text-ink font-semibold">{s.title}</h3>
                    <div className="p-3.5 rounded-2xl bg-paper-elevated border border-line-subtle text-xs text-ink italic font-serif">
                      &ldquo;{s.q}&rdquo;
                    </div>
                  </div>
                  <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                    <span>Adaptive Difficulty</span>
                    <span className="text-leaf font-medium">5-Level Ladder</span>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-6">
          <h2 className="font-display text-3xl sm:text-5xl text-ink font-semibold tracking-tight">
            Ready to experience voice-first learning?
          </h2>
          <p className="text-ink-soft text-base sm:text-lg max-w-xl">
            Ask a real mathematics, science, or English question &mdash; speaking naturally in English, Pidgin, or mixed speech.
          </p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-full bg-indigo text-paper px-8 py-4 text-base font-semibold hover:bg-indigo-soft transition-all shadow-md active:scale-[0.98]"
          >
            <span>Launch Voice Tutor</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
          <p className="text-xs text-ink-muted max-w-lg pt-6 mt-2 border-t border-line/60">
            Regamos VoiceLearn Africa uses in-memory audio processing. Designed for secondary learning environments in collaboration with Regamos Royal Academy.
          </p>
        </div>
      </section>
    </div>
  );
}
