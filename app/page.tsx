import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-paper-elevated/40 via-paper to-paper pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-ochre-light/70 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-indigo-light/50 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl flex flex-col gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-paper-card border border-line shadow-2xs w-fit text-xs text-ink-soft">
              <span className="flex h-2 w-2 rounded-full bg-leaf animate-pulse" aria-hidden="true" />
              <span className="font-semibold text-ink">Regamos Foundation</span>
              <span className="text-ink-muted">&middot;</span>
              <span className="text-indigo font-medium">Intron Sahara CodeSwitch Africa Challenge</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-ink font-normal tracking-tight leading-[1.12]">
              Learning should understand the learner,{" "}
              <span className="italic text-ochre font-serif">not force the learner</span> to change how they speak.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-normal">
              Ask questions the way you naturally speak. VoiceLearn Africa listens for the underlying meaning across English and Nigerian Pidgin code-switching, explains the core concept, tests active recall, and adapts to you.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link href="/learn" className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo text-paper px-6 py-3.5 text-sm sm:text-base font-medium hover:bg-indigo-soft transition-all shadow-sm active:scale-[0.98]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span>Launch Voice Tutor</span>
              </Link>
              <Link href="/benchmark" className="inline-flex items-center justify-center gap-2 rounded-xl bg-paper-card border border-line px-5 py-3.5 text-sm sm:text-base font-medium text-ink hover:bg-paper-elevated transition-all shadow-2xs">
                <span>Benchmark &amp; Evaluation</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Live Trust Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-line/80 mt-4">
              <div>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-leaf">3.6%</p>
                <p className="text-xs text-ink-muted mt-0.5">Real speech WER on Intron Sahara STT</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-indigo">79.3%</p>
                <p className="text-xs text-ink-muted mt-0.5">Intent classification baseline on dataset</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-ochre">Live</p>
                <p className="text-xs text-ink-muted mt-0.5">Streaming WebSocket authenticated</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-ink">0%</p>
                <p className="text-xs text-ink-muted mt-0.5">Audio persistence &mdash; in-memory privacy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Code-Switching Reality */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-widest text-ochre font-bold mb-2">The Classroom Reality</p>
            <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">
              African classrooms are multilingual. Voice assistants are not.
            </h2>
            <p className="text-ink-soft text-sm sm:text-base mt-3 leading-relaxed">
              When a secondary-school learner in Lagos, Accra, or Nairobi struggles with a concept, they think and ask in natural code-switched speech. Conventional speech engines reject or mishear these questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conventional AI */}
            <div className="rounded-2xl border border-rust-border/80 bg-rust-light/30 p-6 sm:p-8">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-rust bg-rust-light px-2.5 py-1 rounded-md border border-rust-border">
                  Conventional Speech AI
                </span>
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-ink-muted uppercase tracking-wider">Learner says:</p>
                  <blockquote className="text-sm sm:text-base text-ink font-serif italic bg-paper-card p-3.5 rounded-xl border border-line">
                    &ldquo;Why negative times negative go give positive?&rdquo;
                  </blockquote>
                </div>
                <div className="p-3 rounded-lg bg-rust-light text-rust text-xs font-mono border border-rust-border/60">
                  &quot;I didn&apos;t catch that. Please speak standard English.&quot;
                </div>
                <p className="text-xs text-ink-muted">
                  Forces cognitive friction right when the learner needs help.
                </p>
              </div>
            </div>

            {/* VoiceLearn Africa */}
            <div className="rounded-2xl border border-leaf-border bg-leaf-light/40 p-6 sm:p-8 shadow-xs">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-leaf bg-leaf-light px-2.5 py-1 rounded-md border border-leaf-border">
                  VoiceLearn Africa (Sahara STT)
                </span>
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-ink-muted uppercase tracking-wider">Learner says:</p>
                  <blockquote className="text-sm sm:text-base text-ink font-serif italic bg-paper-card p-3.5 rounded-xl border border-line">
                    &ldquo;Why negative times negative go give positive?&rdquo;
                  </blockquote>
                </div>
                <div className="p-3.5 rounded-lg bg-paper-card border border-leaf-border/80 text-xs sm:text-sm space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-light text-indigo text-[11px] font-medium">Math: Signed Multiplication</span>
                    <span className="px-2 py-0.5 rounded bg-leaf-light text-leaf text-[11px] font-medium">Conceptual Need</span>
                  </div>
                  <p className="text-ink text-xs sm:text-sm font-medium pt-1">
                    &quot;Think of a negative sign as changing direction on a number line. Multiplying reverses your direction twice, turning you back toward positive!&quot;
                  </p>
                </div>
                <p className="text-xs text-leaf-dark font-medium pt-1">
                  Validates the learner&apos;s natural expression, unlocks immediate comprehension.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 6-Step Voice Learning Cycle */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper-subtle/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-widest text-indigo-soft font-bold mb-2">Pedagogical Engine</p>
            <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">
              A Complete Voice-First Educational Cycle
            </h2>
            <p className="text-ink-soft text-sm sm:text-base mt-2">
              VoiceLearn executes an authentic pedagogical ladder: Speak &rarr; Understand &rarr; Explain &rarr; Practise &rarr; Assess &rarr; Adapt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { n: 1, title: "Speak Naturally", tag: "Microphone Stream", tagColor: "text-ochre", desc: "The learner speaks freely in English, Nigerian Pidgin, or mixed speech. Audio streams via real-time WebSocket directly to Sahara STT.", footer: "PCM16 mono 16kHz &mdash; in-memory streaming" },
              { n: 2, title: "Understand Educational Need", tag: "Intent Extraction", tagColor: "text-leaf", desc: "Identifies the underlying topic, subject domain, and learning intent (conceptual, procedural, or clarification) with 79.3% benchmarked accuracy.", footer: "Zod-validated schema &mdash; deterministic safety" },
              { n: 3, title: "Teach the Core Concept", tag: "Direct Instruction", tagColor: "text-indigo", desc: "Delivers a concise, intuition-first explanation calibrated to secondary-school curriculum standards.", footer: "Secondary Mathematics, Biology &amp; English" },
              { n: 4, title: "Targeted Follow-up", tag: "Active Recall", tagColor: "text-ochre", desc: "Instantly poses a targeted check question that the student answers by speaking, validating active recall.", footer: "Multi-turn conversation state persistence" },
              { n: 5, title: "Diagnose Misconceptions", tag: "Diagnostic Feedback", tagColor: "text-leaf", desc: "Evaluates the learner's answer for known misconceptions with constructive coaching.", footer: "Outcome tagging: Correct / Misconception / Uncertain" },
              { n: 6, title: "Adjust Difficulty", tag: "Adaptive Progression", tagColor: "text-indigo", desc: "Dynamically steps difficulty up or down across a 5-level ladder based on historical turn performance.", footer: "Difficulty ladder Level 1 &rarr; Level 5" },
            ].map((step) => (
              <div key={step.n} className="bg-paper-card border border-line rounded-2xl p-6 flex-col justify-between shadow-2xs hover:border-indigo/40 transition-all flex">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-lg bg-indigo text-paper flex items-center justify-center font-display font-semibold text-sm">{step.n}</span>
                    <span className={`text-[11px] uppercase tracking-wider font-semibold ${step.tagColor}`}>{step.tag}</span>
                  </div>
                  <h3 className="font-display text-lg text-ink font-medium">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-ink-muted" dangerouslySetInnerHTML={{ __html: step.footer }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Curriculum */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-widest text-ochre font-bold mb-2">Curriculum Alignment</p>
              <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">
                Secondary Subjects Built for Real Questions
              </h2>
              <p className="text-ink-soft text-sm sm:text-base mt-2">Curriculum domains mapped to real code-switched questions.</p>
            </div>
            <Link href="/learn" className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-indigo hover:text-indigo-soft underline underline-offset-4">Try all prompts in the voice tutor &rarr;</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            { [
              { subject: "Mathematics", badge: "bg-indigo-light text-indigo", level: "JS3 / SS1", title: "Signed Integer Multiplication", desc: "Understanding why the product of two negative values yields a positive result.", q: "So if minus four times minus three, wetin I go get?" },
              { subject: "Biology / Science", badge: "bg-leaf-light text-leaf", level: "JS2 / SS1", title: "Photosynthesis & Chlorophyll", desc: "Exploring how chlorophyll absorbs solar wavelengths and fuels glucose production.", q: "Teacher talk say photosynthesis dey use light, but why chlorophyll dey absorb light like that?" },
              { subject: "English Language", badge: "bg-ochre-light text-ochre", level: "JS1 \u2013 SS3", title: "Reading Comprehension: Main Idea", desc: "Distinguishing central arguments from supporting examples and narrative details.", q: "Every paragraph in this passage dey talk about different example, so wetin be the main idea?" },
            ].map((s) => (
              <div key={s.subject} className="rounded-2xl border border-line bg-paper-card p-6 flex-col justify-between shadow-2xs flex">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md font-semibold text-xs ${s.badge}`}>{s.subject}</span>
                    <span className="text-xs text-ink-muted font-mono">{s.level}</span>
                  </div>
                  <h3 className="font-display text-lg text-ink font-medium">{s.title}</h3>
                  <p className="text-xs text-ink-soft leading-relaxed">{s.desc}</p>
                  <div className="p-3 rounded-xl bg-paper-elevated border border-line-subtle text-xs text-ink italic font-serif">
                    &ldquo;{s.q}&rdquo;
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                  <span>Ladder: 5 Difficulty Steps</span>
                  <span className="text-leaf font-medium">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Sahara Credibility */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper-subtle/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-light text-indigo text-xs font-semibold">Speech Infrastructure</div>
              <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">Powered by Intron Sahara Speech Intelligence</h2>
              <p className="text-ink-soft text-sm sm:text-base leading-relaxed">Generic global speech models treat African accents and Nigerian Pidgin code-switching as accented noise. Intron Sahara is specifically trained on African phonology, preserving critical code-switch particles such as &ldquo;wetin&rdquo;, &ldquo;dey&rdquo;, and &ldquo;sef&rdquo;.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-paper-card border border-line">
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">WebSocket Streaming</p>
                  <p className="text-sm text-ink font-medium mt-1">Real-Time Chunking</p>
                  <p className="text-xs text-ink-soft mt-1">Streams dual-mode PCM16 16kHz audio directly to Intron inference gateway.</p>
                </div>
                <div className="p-4 rounded-xl bg-paper-card border border-line">
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">Multilingual Modeling</p>
                  <p className="text-sm text-ink font-medium mt-1">Code-Switch Preservation</p>
                  <p className="text-xs text-ink-soft mt-1">Retains mid-sentence language shifts between English and Pidgin without hallucinating translation.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-line bg-paper-card p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <span className="text-xs uppercase tracking-wider text-ink font-semibold">Provider Status Matrix</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-leaf-light text-leaf font-semibold">Verified Live</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between"><span className="font-medium text-ink">Intron Sahara STT</span><span className="text-leaf font-semibold">Live (3.6% Measured WER)</span></div>
                  <div className="flex items-center justify-between text-ink-soft"><span>WebSocket Gateway</span><span className="font-mono text-ink-muted">infer.voice.intron.io</span></div>
                  <div className="flex items-center justify-between text-ink-soft"><span>Audio Format</span><span className="font-mono text-ink-muted">PCM16 Mono 16kHz</span></div>
                  <div className="flex items-center justify-between text-ink-soft"><span>Educational Validation</span><span className="text-ink font-medium">Regamos Royal Academy</span></div>
                  <div className="flex items-center justify-between text-ink-soft"><span>Comparison Model B / C</span><span className="text-ink-muted italic">Requires 3rd-Party API Access</span></div>
                </div>
                <div className="pt-3 border-t border-line/80">
                  <Link href="/benchmark" className="block text-center text-xs font-semibold text-indigo hover:text-indigo-soft py-2 rounded-lg bg-indigo-light/60 transition-colors">Open Research &amp; Benchmark Console &rarr;</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="py-16 sm:py-20 bg-paper">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-5xl text-ink font-normal tracking-tight">Ready to experience voice-first learning?</h2>
          <p className="text-ink-soft text-base sm:text-lg max-w-xl mx-auto">
            Test the live microphone tutor with real secondary mathematics, biology, or English comprehension questions.
          </p>
          <div>
            <Link href="/learn" className="inline-flex items-center gap-2 rounded-xl bg-indigo text-paper px-8 py-4 text-base font-semibold hover:bg-indigo-soft transition-all shadow-sm active:scale-[0.98]">
              <span>Launch Voice Tutor Now</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
          <p className="text-xs text-ink-muted max-w-lg mx-auto pt-4 border-t border-line/60">
            Regamos VoiceLearn Africa is committed to responsible AI. Voice recordings are processed in memory for live inference and discarded immediately. Designed for educational validation in secondary learning settings.
          </p>
        </div>
      </section>
    </div>
  );
}
