import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About & Responsible AI — VoiceLearn Africa",
  description:
    "Sociolinguistic foundations, pedagogical architecture, and responsible AI framework behind VoiceLearn Africa.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-12 text-ink-soft leading-relaxed">
      {/* 1. Header & Purpose */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ochre-light text-ochre text-xs font-semibold border border-ochre-border/60">
          <span>Sociolinguistics & Ethical AI</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl text-ink font-normal tracking-tight">
          About VoiceLearn Africa
        </h1>
        <p className="text-base sm:text-xl text-ink leading-relaxed font-normal">
          An intelligent voice-first educational tutoring system engineered around African multilingual code-switched speech — submitted by the Regamos Foundation for the Intron Sahara CodeSwitch Africa Challenge.
        </p>
      </div>

      {/* 2. The Core Linguistic Foundation */}
      <section className="rounded-2xl border border-line bg-paper-card p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="font-display text-2xl text-ink font-semibold">
          The Sociolinguistic Reality in African Education
        </h2>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          In classrooms across Nigeria and West Africa, secondary-school learners routinely code-switch between standard English and Nigerian Pidgin (or indigenous languages like Yoruba, Igbo, and Hausa) within a single spoken sentence.
        </p>
        <div className="p-4 rounded-xl bg-paper-subtle border border-line/80 space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink font-bold">Linguistic Principle:</p>
          <p className="text-sm text-ink font-serif italic">
            &ldquo;Code-switching is not a sign of language deficiency; it is a sophisticated, communicative strategy that students use to articulate complex scientific and mathematical concepts.&rdquo;
          </p>
        </div>
        <p className="text-sm text-ink-soft leading-relaxed">
          Standard monolingual speech engines classify these fluid shifts as grammatical errors or noise, forcing students to translate their thoughts into rigid Queen&apos;s English before asking a question. VoiceLearn Africa removes this cognitive barrier: learners ask naturally, and the system understands what they mean.
        </p>
      </section>

      {/* 3. Pedagogical Architecture */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink font-semibold">
          Why VoiceLearn is Not Just a Transcription Wrapper
        </h2>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          A conventional voice assistant treats speech as a simple conduit: <code>Speech → Text → Answer</code>. VoiceLearn executes a full pedagogical feedback loop:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-xl border border-line bg-paper-card space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo">1. Speech to Intent</span>
            <h3 className="font-semibold text-ink text-sm">Understands Educational Need</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Extracts the underlying curriculum concept and intent type (conceptual, procedural, or clarification) rather than generating unvalidated LLM prose.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-line bg-paper-card space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-leaf">2. Intuitive Instruction</span>
            <h3 className="font-semibold text-ink text-sm">Curriculum-Aligned Explanation</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Delivers intuition-first instruction calibrated to secondary-school syllabus benchmarks without confusing jargon.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-line bg-paper-card space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-ochre">3. Diagnostic Assessment</span>
            <h3 className="font-semibold text-ink text-sm">Active Recall & Misconception Check</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Poses follow-up check questions and diagnoses common learner mistakes (e.g., negative sign rules or light spectrum errors).
            </p>
          </div>

          <div className="p-5 rounded-xl border border-line bg-paper-card space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-terracotta">4. Dynamic Adaptation</span>
            <h3 className="font-semibold text-ink text-sm">5-Level Difficulty Ladder</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Adjusts difficulty up or down dynamically based on historical answer outcomes to sustain optimal learning velocity.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Responsible AI & Safeguarding Framework */}
      <section id="responsible-ai" className="space-y-6 pt-4">
        <div className="space-y-2" id="safety">
          <h2 className="font-display text-2xl sm:text-3xl text-ink font-semibold">
            Responsible AI & Safety Framework
          </h2>
          <p className="text-sm text-ink-soft">
            VoiceLearn Africa is built according to strict educational safety, child protection, and privacy principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pillar 1: Privacy */}
          <div className="rounded-2xl border border-line bg-paper-card p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-leaf" />
              <h3 className="font-semibold text-ink text-sm">Privacy & Zero Audio Persistence</h3>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              Voice data is biometric-adjacent. In VoiceLearn Africa, audio buffers are processed in volatile memory for live transcription and discarded immediately after inference. We do not store raw audio or build biometric learner profiles.
            </p>
          </div>

          {/* Pillar 2: Child Safeguarding */}
          <div className="rounded-2xl border border-line bg-paper-card p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo" />
              <h3 className="font-semibold text-ink text-sm">Child Safeguarding & Consent</h3>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              Our target audience is secondary-school learners (ages 12–18). In compliance with international safeguarding standards, this MVP evaluation dataset was authored by adult engineers. Any future school pilot mandates parental and institutional consent.
            </p>
          </div>

          {/* Pillar 3: Low-Stakes Scope */}
          <div className="rounded-2xl border border-line bg-paper-card p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ochre" />
              <h3 className="font-semibold text-ink text-sm">Low-Stakes Educational Scope</h3>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              VoiceLearn is strictly an interactive study and revision companion. It is explicitly not designed for high-stakes formal grading, academic admissions, or disciplinary evaluation.
            </p>
          </div>

          {/* Pillar 4: Transparent AI Disclosures */}
          <div className="rounded-2xl border border-line bg-paper-card p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-terracotta" />
              <h3 className="font-semibold text-ink text-sm">Transparent AI Disclosures</h3>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              Automated speech recognition and language models can occasionally mishear or misclassify input. The application clearly discloses AI participation and provides immediate error recovery (such as manual text correction and retry prompts).
            </p>
          </div>

          {/* Pillar 5: Teacher Oversight */}
          <div className="rounded-2xl border border-line bg-paper-card p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo" />
              <h3 className="font-semibold text-ink text-sm">Human & Teacher Oversight</h3>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              VoiceLearn is built to assist and empower teachers, not replace them. In classroom deployments, teachers can inspect session logs, track difficulty ladders, and verify diagnostic feedback.
            </p>
          </div>

          {/* Pillar 6: Scientific Honesty */}
          <div className="rounded-2xl border border-line bg-paper-card p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-leaf" />
              <h3 className="font-semibold text-ink text-sm">Scientific Integrity & Honesty</h3>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              We never fabricate metrics, school partnership claims, or user counts. Our benchmark page honestly reports verified intent accuracy (79.3%) and clearly marks unrecorded audio and comparison API access as pending.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Intron Sahara Speech STT Integration */}
      <section className="rounded-2xl border border-line bg-paper-card p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="font-display text-2xl text-ink font-semibold">
          Intron Sahara Speech Intelligence
        </h2>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          Intron Sahara provides the state-of-the-art streaming speech-to-text API specialized for African accents and code-switched vocabularies. Our backend integrates directly via secure WebSockets:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-ink-soft">
          <li>
            <strong className="text-ink">WebSocket Endpoint:</strong> <code>wss://infer.voice.intron.io/stt/v1/stream</code>
          </li>
          <li>
            <strong className="text-ink">Audio Processing:</strong> Client-side MediaRecorder capture converted to dual-mode PCM16 mono 16,000 Hz.
          </li>
          <li>
            <strong className="text-ink">Zero Secret Leakage:</strong> <code>SAHARA_API_KEY</code> is strictly server-side; zero credentials exposed in client bundles.
          </li>
          <li>
            <strong className="text-ink">Code-Switch Preservation:</strong> Preserves crucial grammatical markers (<em>&ldquo;dey&rdquo;</em>, <em>&ldquo;wetin&rdquo;</em>, <em>&ldquo;sef&rdquo;</em>, <em>&ldquo;abeg&rdquo;</em>) ensuring faithful downstream interpretation.
          </li>
        </ul>
      </section>

      {/* 6. Call to Action / Next Steps */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-line bg-paper-subtle">
        <div>
          <p className="font-semibold text-ink text-sm">Explore the Voice Tutor</p>
          <p className="text-xs text-ink-muted">Experience real-time code-switched learning across Math, Science, and English.</p>
        </div>
        <Link
          href="/learn"
          className="rounded-xl bg-indigo text-paper px-5 py-2.5 text-xs font-semibold hover:bg-indigo-soft transition-all shrink-0"
        >
          Launch Tutor Console →
        </Link>
      </div>
    </div>
  );
}
