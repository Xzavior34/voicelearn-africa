import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About — Regamos VoiceLearn",
  description:
    "The philosophy behind Regamos VoiceLearn: why voice, why code-switching, and how we approach responsible pedagogical design for learners.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-16">
      {/* 1. Header with Visual Accent */}
      <div className="flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ochre-light text-ochre text-xs font-semibold w-fit border border-ochre-border/60">
          <span className="h-2 w-2 rounded-full bg-ochre" aria-hidden="true" />
          <span>Sociolinguistics &middot; Pedagogy &middot; Ethics</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-ink font-semibold tracking-tight leading-[1.08]">
          Learning should understand the learner.
        </h1>
        <p className="text-base sm:text-xl text-ink-soft leading-relaxed max-w-2xl font-normal">
          Not force the learner to change how they speak. That core principle shapes every layer of
          Regamos VoiceLearn &mdash; from real-time acoustic recognition to adaptive pedagogical reasoning.
        </p>
      </div>

      {/* 2. Visual Feature & Sociolinguistics */}
      <section className="flex flex-col gap-8 pt-6 border-t border-line">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 relative rounded-3xl overflow-hidden border border-line shadow-sm">
            <Image
              src="/images/hero-learner.jpg"
              alt="West African secondary school learner speaking with VoiceLearn conversational tutor"
              width={640}
              height={360}
              className="w-full h-auto object-cover"
            />
            <div className="p-4 bg-paper-card border-t border-line text-xs text-ink-soft flex items-center justify-between">
              <span className="font-semibold text-ink">Classroom Linguistic Reality</span>
              <span className="text-leaf font-mono">English + Nigerian Pidgin</span>
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-4">
            <h2 className="font-display text-2xl sm:text-3xl text-ink font-semibold tracking-tight">
              Learning should adapt to people
            </h2>
            <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
              In secondary classrooms across Nigeria and West Africa, learners routinely shift between
              Standard English and Nigerian Pidgin &mdash; often within the same question. This
              isn&apos;t a sign of confusion; it is an authentic, fluent way of thinking and communicating.
            </p>
            <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
              When a student struggles with a difficult mathematical or scientific concept, forcing them to
              re-encode their question into stiff formal English adds unnecessary cognitive friction. VoiceLearn removes that barrier.
            </p>
          </div>
        </div>

        {/* 3. The Code-Switching Architecture Diagram */}
        <div className="rounded-3xl border border-line bg-paper-card/70 p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo font-bold mb-1">Architecture Flow</p>
            <h3 className="font-display text-xl text-ink font-semibold">The VoiceLearn Speech Intelligence Bridge</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-paper border border-line flex flex-col gap-2">
              <span className="font-mono text-ochre font-bold">01 &middot; Voice Input</span>
              <p className="font-medium text-ink">Natural Code-Switching</p>
              <p className="text-ink-muted">Learner speaks freely in English, Pidgin, or mixed speech.</p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line flex flex-col gap-2">
              <span className="font-mono text-cyan font-bold">02 &middot; STT Engine</span>
              <p className="font-medium text-ink">Intron Sahara v2.5</p>
              <p className="text-ink-muted">Trained on African phonetics, preserving particles like &ldquo;wetin&rdquo; and &ldquo;dey&rdquo;.</p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line flex flex-col gap-2">
              <span className="font-mono text-indigo font-bold">03 &middot; Intent Engine</span>
              <p className="font-medium text-ink">Curriculum Mapping</p>
              <p className="text-ink-muted">Extracts subject, topic, and learning need (conceptual vs procedural).</p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line flex flex-col gap-2">
              <span className="font-mono text-leaf font-bold">04 &middot; Pedagogy</span>
              <p className="font-medium text-ink">Active Recall &amp; Adapt</p>
              <p className="text-ink-muted">Delivers structured explanation, checks understanding, and adjusts difficulty.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 5-Step Pedagogical Ladder */}
      <section className="flex flex-col gap-6 pt-8 border-t border-line">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-indigo font-bold mb-1">Instructional Design</p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink font-semibold tracking-tight">
            Designed for authentic learning
          </h2>
          <p className="text-ink-soft text-sm sm:text-base mt-2 max-w-2xl">
            VoiceLearn is not a transcription utility with a chatbot attached. Every interaction follows the time-tested rhythm of master tutoring:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { step: "Ask", tag: "Natural Speech", desc: "The learner speaks their question in whatever mix of languages feels most intuitive." },
            { step: "Understand", tag: "Intent Extraction", desc: "The core subject domain and conceptual confusion are identified with precision." },
            { step: "Practise", tag: "Active Recall", desc: "A concise, intuitive explanation is paired immediately with a targeted check question." },
            { step: "Reflect", tag: "Diagnostic Feedback", desc: "Answers are analyzed for common misconceptions with constructive coaching." },
            { step: "Improve", tag: "Adaptive Ladder", desc: "Difficulty adjusts dynamically across 5 mastery levels based on student progress." },
          ].map((item, idx) => (
            <div key={item.step} className="p-5 rounded-2xl border border-line bg-paper-card flex flex-col justify-between gap-3 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-indigo">Stage 0{idx + 1}</span>
                  <span className="text-[11px] font-mono text-ink-muted">{item.tag}</span>
                </div>
                <h3 className="font-display text-lg text-ink font-semibold">{item.step}</h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Responsible AI Principles */}
      <section id="responsible" className="flex flex-col gap-6 pt-8 border-t border-line scroll-mt-20">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-leaf font-bold mb-1">Ethical Framework</p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink font-semibold tracking-tight">
            Responsible by design
          </h2>
          <p className="text-ink-soft text-sm sm:text-base mt-2 max-w-2xl">
            VoiceLearn is built strictly as a low-stakes revision companion to support teachers, never replace them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Privacy & Ephemeral Audio",
              desc: "Voice audio is processed in-memory for live transcription and discarded immediately. No voiceprints or biometric profiles are ever stored.",
              icon: "🛡️",
            },
            {
              title: "Consent & Safeguarding",
              desc: "Scoped strictly to secondary school curriculum subjects with zero open-ended or unsupervised chat, ensuring safe learning environments.",
              icon: "🔒",
            },
            {
              title: "Teacher in the Loop",
              desc: "Designed to reinforce classroom instruction and revision. Never used for grading, admissions, or high-stakes evaluation.",
              icon: "👩‍🏫",
            },
            {
              title: "Honest Limitations",
              desc: "Explicitly states when a question falls outside the verified curriculum rather than hallucinating answers.",
              icon: "📖",
            },
          ].map((principle) => (
            <div key={principle.title} className="p-5 rounded-2xl border border-line bg-paper-card/70 flex flex-col gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">{principle.icon}</span>
                <h3 className="font-display text-base text-ink font-semibold">{principle.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{principle.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-line bg-paper-subtle/40 p-8 rounded-3xl">
        <div>
          <p className="font-display text-xl text-ink font-semibold">Experience the Voice Tutor</p>
          <p className="text-xs text-ink-soft mt-1">Ask questions across secondary Mathematics, Biology, and English comprehension.</p>
        </div>
        <Link
          href="/learn"
          className="rounded-full bg-indigo text-paper px-6 py-3.5 text-sm font-semibold hover:bg-indigo-soft transition-all shadow-sm active:scale-[0.98] shrink-0"
        >
          Launch Voice Tutor
        </Link>
      </div>
    </div>
  );
}
