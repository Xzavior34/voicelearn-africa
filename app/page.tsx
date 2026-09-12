import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section: Intellectual, Grounded & Inspiring */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-paper-elevated/40 via-paper to-paper pt-14 pb-20 sm:pt-20 sm:pb-28">
        {/* Subtle Decorative Ambient Geometry */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-ochre-light/70 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-indigo-light/50 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl flex flex-col gap-6">
            {/* Challenge & Engine Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-paper-card border border-line shadow-sm w-fit text-xs text-ink-soft">
              <span className="flex h-2 w-2 rounded-full bg-leaf animate-pulse" aria-hidden="true" />
              <span className="font-medium text-ink">Intron Sahara CodeSwitch Africa Challenge</span>
              <span className="text-ink-muted">·</span>
              <span className="text-indigo font-medium">Secondary Education Track</span>
            </div>

            {/* Main Value Proposition */}
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-ink font-normal tracking-tight leading-[1.12]">
              Learning should understand the learner,{" "}
              <span className="italic text-ochre font-serif">not force the learner</span> to change how they speak.
            </h1>

            {/* Subheading / Description */}
            <p className="text-base sm:text-xl text-ink-soft leading-relaxed max-w-2xl font-normal">
              African students often ask questions by blending English and Nigerian Pidgin. VoiceLearn Africa uses Sahara Speech AI to understand natural, code-switched questions — teaching core concepts, testing understanding, and adapting to every learner.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo text-paper px-6 py-3.5 text-base font-medium hover:bg-indigo-soft transition-all shadow-md active:scale-[0.98]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span>Launch Voice Tutor</span>
              </Link>

              <Link
                href="/benchmark"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-paper-card border border-line px-5 py-3.5 text-base font-medium text-ink hover:bg-paper-elevated transition-all shadow-sm"
              >
                <span>View Benchmark (79.3% Accuracy)</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Live Trust Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-line/80 mt-4">
              <div>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-indigo">79.3%</p>
                <p className="text-xs text-ink-muted mt-0.5">Intent accuracy on code-switched curriculum</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-leaf">Live</p>
                <p className="text-xs text-ink-muted mt-0.5">Sahara STT streaming WebSocket authenticated</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-2xl sm:text-3xl font-display font-semibold text-ochre">0%</p>
                <p className="text-xs text-ink-muted mt-0.5">Audio persistence — privacy-first in-memory</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Code-Switching Reality: Why Existing Tools Fail */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-widest text-ochre font-bold mb-2">The Problem</p>
            <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">
              African classrooms are multilingual. Voice assistants are not.
            </h2>
            <p className="text-ink-soft text-base sm:text-lg mt-3 leading-relaxed">
              When a secondary-school learner in Lagos or Abuja struggles with negative numbers, they think and ask in natural blended speech. Conventional monolingual speech engines mishear or reject these queries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Speech Assistant Card */}
            <div className="rounded-2xl border border-rust-border/80 bg-rust-light/30 p-6 sm:p-8 flex flex-col justify-between relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rust bg-rust-light px-2.5 py-1 rounded-md border border-rust-border">
                    Conventional Speech AI
                  </span>
                  <span className="text-xs text-rust font-medium">Fails Code-Switching</span>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs text-ink-muted uppercase tracking-wider">Learner says:</p>
                  <blockquote className="text-base text-ink font-serif italic bg-paper-card p-3.5 rounded-xl border border-line">
                    &ldquo;Why negative times negative go give positive?&rdquo;
                  </blockquote>
                </div>

                <div className="space-y-2 pt-1 text-sm text-ink-soft">
                  <p className="text-xs text-rust font-semibold uppercase tracking-wider">System output:</p>
                  <div className="p-3 rounded-lg bg-rust-light text-rust text-xs sm:text-sm font-mono border border-rust-border/60">
                    &ldquo;I didn&apos;t understand that. Please speak standard English.&rdquo;
                  </div>
                  <p className="text-xs text-ink-muted pt-1">
                    Forces cognitive friction, self-censorship, and disengagement right when the learner needs help.
                  </p>
                </div>
              </div>
            </div>

            {/* VoiceLearn Africa Card */}
            <div className="rounded-2xl border border-leaf-border bg-leaf-light/40 p-6 sm:p-8 flex flex-col justify-between relative shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-leaf bg-leaf-light px-2.5 py-1 rounded-md border border-leaf-border">
                    VoiceLearn Africa (Sahara AI)
                  </span>
                  <span className="text-xs text-leaf font-medium">Understands Meaning</span>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs text-ink-muted uppercase tracking-wider">Learner says:</p>
                  <blockquote className="text-base text-ink font-serif italic bg-paper-card p-3.5 rounded-xl border border-line">
                    &ldquo;Why negative times negative go give positive?&rdquo;
                  </blockquote>
                </div>

                <div className="space-y-2 pt-1 text-sm text-ink-soft">
                  <p className="text-xs text-leaf font-semibold uppercase tracking-wider">VoiceLearn Pedagogical Response:</p>
                  <div className="p-3.5 rounded-lg bg-paper-card border border-leaf-border/80 text-xs sm:text-sm space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-light text-indigo text-[11px] font-medium">Math: Signed Multiplication</span>
                      <span className="px-2 py-0.5 rounded bg-leaf-light text-leaf text-[11px] font-medium">Conceptual Need</span>
                    </div>
                    <p className="text-ink text-xs sm:text-sm font-medium pt-1">
                      &ldquo;Think of a negative sign as changing direction on a number line. Multiplying reverses your direction twice, turning you back toward positive!&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-leaf-dark font-medium pt-1">
                    Preserves African identity, unlocks immediate comprehension, and prompts an interactive check question.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 6-Step Voice Learning Cycle */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper-subtle/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-widest text-indigo-soft font-bold mb-2">Pedagogical Engine</p>
            <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">
              A Complete Voice-First Educational Cycle
            </h2>
            <p className="text-ink-soft text-sm sm:text-base mt-2">
              VoiceLearn isn&apos;t a voice assistant wrapper. It executes an authentic pedagogical ladder designed for mastery revision.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Step 1: SPEAK */}
            <div className="bg-paper-card border border-line rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-indigo/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="h-8 w-8 rounded-lg bg-indigo text-paper flex items-center justify-center font-display font-semibold text-sm">
                    1
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-ochre font-semibold">Microphone Stream</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Speak Naturally</h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  The learner speaks freely in English, Nigerian Pidgin, or mixed speech. Audio streams via real-time WebSocket directly to Sahara STT.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-ink-muted">
                PCM16 mono 16kHz · In-memory processing
              </div>
            </div>

            {/* Step 2: UNDERSTAND */}
            <div className="bg-paper-card border border-line rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-indigo/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="h-8 w-8 rounded-lg bg-indigo text-paper flex items-center justify-center font-display font-semibold text-sm">
                    2
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-leaf font-semibold">Intent Reasoning</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Extract Educational Need</h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Identifies the underlying topic, subject domain, and learning intent (conceptual, procedural, or clarification) with 79.3% benchmarked accuracy.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-ink-muted">
                Zod validated schema · Deterministic safety
              </div>
            </div>

            {/* Step 3: EXPLAIN */}
            <div className="bg-paper-card border border-line rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-indigo/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="h-8 w-8 rounded-lg bg-indigo text-paper flex items-center justify-center font-display font-semibold text-sm">
                    3
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-indigo font-semibold">Direct Pedagogy</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Teach the Core Concept</h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Delivers a concise, intuition-first explanation calibrated to secondary-school curriculum standards without condescension.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-ink-muted">
                Secondary Mathematics, Biology & English
              </div>
            </div>

            {/* Step 4: PRACTISE */}
            <div className="bg-paper-card border border-line rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-indigo/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="h-8 w-8 rounded-lg bg-indigo text-paper flex items-center justify-center font-display font-semibold text-sm">
                    4
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-ochre font-semibold">Active Recall</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Targeted Follow-up</h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Instantly poses a targeted check question that the student must answer by speaking, validating active recall over passive reading.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-ink-muted">
                Multi-turn conversation state persistence
              </div>
            </div>

            {/* Step 5: ASSESS */}
            <div className="bg-paper-card border border-line rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-indigo/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="h-8 w-8 rounded-lg bg-indigo text-paper flex items-center justify-center font-display font-semibold text-sm">
                    5
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-leaf font-semibold">Diagnostic Feedback</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Diagnose Misconceptions</h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Evaluates the learner&apos;s answer for known misconceptions (such as sign confusion or light absorption misunderstandings) with constructive feedback.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-ink-muted">
                Outcome tagging: Correct / Misconception / Uncertain
              </div>
            </div>

            {/* Step 6: ADAPT */}
            <div className="bg-paper-card border border-line rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-indigo/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="h-8 w-8 rounded-lg bg-indigo text-paper flex items-center justify-center font-display font-semibold text-sm">
                    6
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-indigo font-semibold">Adaptive Progression</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Adjust Difficulty</h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Dynamically steps difficulty up or down across a 5-level ladder based on historical turn performance, maintaining the zone of proximal development.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 text-[11px] text-ink-muted">
                Difficulty ladder Level 1 → Level 5
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Supported Curriculum & Interactive Prompt Showcase */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-widest text-ochre font-bold mb-2">Curriculum Alignment</p>
              <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">
                Secondary Subjects Built for Real Questions
              </h2>
              <p className="text-ink-soft text-sm sm:text-base mt-2">
                Secondary curriculum domains mapped to real code-switched questions ready to test in the live voice tutor.
              </p>
            </div>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo hover:text-indigo-soft underline underline-offset-4"
            >
              Try all prompts in the tutor →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subject 1: Mathematics */}
            <div className="rounded-2xl border border-line bg-paper-card p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-light text-indigo font-semibold text-xs">
                    Mathematics
                  </span>
                  <span className="text-xs text-ink-muted font-mono">JS3 / SS1</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Signed Integer Multiplication</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Understanding why the product of two negative values yields a positive result on the number line.
                </p>
                <div className="p-3 rounded-xl bg-paper-elevated border border-line-subtle text-xs text-ink italic font-serif">
                  &ldquo;So if minus four times minus three, wetin I go get?&rdquo;
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                <span>Ladder: 5 Difficulty Steps</span>
                <span className="text-leaf font-medium">Active</span>
              </div>
            </div>

            {/* Subject 2: Science & Biology */}
            <div className="rounded-2xl border border-line bg-paper-card p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-leaf-light text-leaf font-semibold text-xs">
                    Biology / Science
                  </span>
                  <span className="text-xs text-ink-muted font-mono">JS2 / SS1</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Photosynthesis & Chlorophyll</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Exploring how chlorophyll absorbs solar wavelengths and fuels the biochemical production of glucose.
                </p>
                <div className="p-3 rounded-xl bg-paper-elevated border border-line-subtle text-xs text-ink italic font-serif">
                  &ldquo;Teacher talk say photosynthesis dey use light, but why chlorophyll dey absorb light like that?&rdquo;
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                <span>Ladder: 5 Difficulty Steps</span>
                <span className="text-leaf font-medium">Active</span>
              </div>
            </div>

            {/* Subject 3: English Comprehension */}
            <div className="rounded-2xl border border-line bg-paper-card p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-ochre-light text-ochre font-semibold text-xs">
                    English Language
                  </span>
                  <span className="text-xs text-ink-muted font-mono">JS1 – SS3</span>
                </div>
                <h3 className="font-display text-lg text-ink font-medium">Reading Comprehension: Main Idea</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Distinguishing central arguments and thesis statements from supporting examples and narrative details.
                </p>
                <div className="p-3 rounded-xl bg-paper-elevated border border-line-subtle text-xs text-ink italic font-serif">
                  &ldquo;Every paragraph in this passage dey talk about different example, so wetin be the main idea?&rdquo;
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                <span>Ladder: 5 Difficulty Steps</span>
                <span className="text-leaf font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Speech Intelligence & Sahara Partnership Credibility */}
      <section className="py-16 sm:py-24 border-b border-line bg-paper-subtle/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-light text-indigo text-xs font-semibold">
                Speech Infrastructure
              </div>
              <h2 className="font-display text-2xl sm:text-4xl text-ink font-normal tracking-tight">
                Powered by Intron Sahara Speech Intelligence
              </h2>
              <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
                Generic global speech models treat African accents and Nigerian Pidgin code-switching as &ldquo;accented noise.&rdquo; Intron Sahara is specifically trained on African phonology, preserving critical code-switch particles such as <em>&ldquo;wetin&rdquo;</em>, <em>&ldquo;dey&rdquo;</em>, and <em>&ldquo;sef&rdquo;</em>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-paper-card border border-line">
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">WebSocket Streaming</p>
                  <p className="text-sm text-ink font-medium mt-1">Real-Time Chunking</p>
                  <p className="text-xs text-ink-soft mt-1">
                    Streams dual-mode PCM16 16kHz audio directly to Intron inference gateway with sub-second handshakes.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-paper-card border border-line">
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">Multilingual Modeling</p>
                  <p className="text-sm text-ink font-medium mt-1">Code-Switch Preservation</p>
                  <p className="text-xs text-ink-soft mt-1">
                    Retains mid-sentence language shifts between English and Pidgin without hallucinating translation.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-line bg-paper-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <span className="text-xs uppercase tracking-wider text-ink font-semibold">Provider Status Matrix</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-leaf-light text-leaf font-medium">Verified</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">Intron Sahara</span>
                    <span className="text-leaf font-semibold">Live (Authenticated)</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span>WebSocket Gateway</span>
                    <span className="font-mono text-ink-muted">infer.voice.intron.io</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span>Audio Format</span>
                    <span className="font-mono text-ink-muted">PCM16 Mono 16kHz</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span>Comparison Model B</span>
                    <span className="text-ink-muted italic">Requires API Access</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span>Comparison Model C</span>
                    <span className="text-ink-muted italic">Requires API Access</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-line/80">
                  <Link
                    href="/benchmark"
                    className="block text-center text-xs font-medium text-indigo hover:text-indigo-soft py-1.5 rounded-lg bg-indigo-light/60 transition-colors"
                  >
                    Open Research & Benchmark Console →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action & Responsible AI Footer Note */}
      <section className="py-16 sm:py-20 bg-paper">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-5xl text-ink font-normal tracking-tight">
            Ready to experience voice-first learning?
          </h2>
          <p className="text-ink-soft text-base sm:text-lg max-w-xl mx-auto">
            Test the live microphone tutor with real secondary mathematics, biology, or English comprehension questions.
          </p>
          <div>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo text-paper px-8 py-4 text-base font-semibold hover:bg-indigo-soft transition-all shadow-md active:scale-[0.98]"
            >
              <span>Launch Voice Tutor Now</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
          <p className="text-xs text-ink-muted max-w-lg mx-auto pt-4 border-t border-line/60">
            VoiceLearn Africa is committed to responsible AI. Audio recordings are held in memory for real-time transcription and immediately discarded. See our{" "}
            <Link href="/about#safety" className="underline hover:text-ink">
              Ethics & Safeguarding framework
            </Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
