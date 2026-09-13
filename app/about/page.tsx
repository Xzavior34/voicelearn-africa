import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Regamos VoiceLearn",
  description:
    "The philosophy behind Regamos VoiceLearn: why voice, why code-switching, and how we approach responsible design for learners.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-16">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ochre font-semibold">About</p>
        <h1 className="font-display text-3xl sm:text-5xl text-ink font-medium tracking-tight">
          Learning should understand the learner.
        </h1>
        <p className="text-base sm:text-lg text-ink-soft leading-relaxed prose-measure">
          Not force the learner to change how they speak. That idea shapes every decision behind
          Regamos VoiceLearn, from how it listens to how it explains.
        </p>
      </div>

      {/* 1. Learning should adapt to people */}
      <section className="flex flex-col gap-4 pt-2 border-t border-line">
        <h2 className="font-display text-2xl text-ink font-medium pt-8">Learning should adapt to people</h2>
        <p className="text-ink-soft leading-relaxed prose-measure">
          In classrooms across Nigeria and much of West Africa, learners routinely move between
          standard English and Nigerian Pidgin &mdash; sometimes within a single sentence. This
          isn&apos;t a sign of confusion or incomplete English. It&apos;s a natural, fluent way of
          thinking and communicating, and it&apos;s especially common in the exact moment a learner
          is struggling with something and reaching for the clearest way to ask about it.
        </p>
        <p className="text-ink-soft leading-relaxed prose-measure">
          Software that treats this mixing as an error forces a learner to do extra work &mdash;
          translating their thought into a more formal register &mdash; before they can even ask
          their question. VoiceLearn is built to do that work instead, so the learner doesn&apos;t
          have to.
        </p>
      </section>

      {/* 2. Voice changes the interaction */}
      <section className="flex flex-col gap-4 pt-8 border-t border-line">
        <h2 className="font-display text-2xl text-ink font-medium">Voice changes the interaction</h2>
        <p className="text-ink-soft leading-relaxed prose-measure">
          Typing a question requires a learner to first put their confusion into tidy written
          words. Speaking is faster and more forgiving &mdash; closer to how they&apos;d ask a
          classmate or a teacher out loud. For a learner who is stuck, that lower barrier can be
          the difference between asking for help and giving up.
        </p>
        <p className="text-ink-soft leading-relaxed prose-measure">
          Speech recognition tuned specifically for African accents and code-switched speech is
          what makes this practical. Generic speech models, trained mostly on other accents and
          monolingual speech, tend to mishear or reject exactly this kind of natural mixing.
          VoiceLearn&apos;s speech recognition is provided by a specialized third-party speech
          partner built for this use case.
        </p>
      </section>

      {/* 3. Designed for real learning */}
      <section className="flex flex-col gap-6 pt-8 border-t border-line">
        <h2 className="font-display text-2xl text-ink font-medium">Designed for real learning</h2>
        <p className="text-ink-soft leading-relaxed prose-measure">
          VoiceLearn isn&apos;t a transcription tool with a chatbot bolted on. Every conversation
          follows the same rhythm a good tutor uses:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
          {[
            ["Ask", "The learner speaks their question, in whatever mix of languages comes naturally."],
            ["Understand", "The subject and underlying concept are identified — not just the words used."],
            ["Practise", "A short, intuitive explanation is followed by a question that checks understanding."],
            ["Reflect", "Answers are checked for common misconceptions, with specific, encouraging feedback."],
            ["Improve", "Difficulty moves up or down across five levels, based on how the conversation goes."],
          ].map(([step, desc]) => (
            <div key={step} className="flex gap-3">
              <span className="font-display text-ink-muted shrink-0">&mdash;</span>
              <p className="text-ink-soft leading-relaxed">
                <span className="text-ink font-medium">{step}.</span> {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Responsible by design */}
      <section id="responsible" className="flex flex-col gap-6 pt-8 border-t border-line scroll-mt-20">
        <h2 className="font-display text-2xl text-ink font-medium">Responsible by design</h2>
        <p className="text-ink-soft leading-relaxed prose-measure">
          VoiceLearn is intended as a low-stakes revision companion, used alongside a teacher, not
          in place of one. A few principles guide how it&apos;s built:
        </p>
        <dl className="flex flex-col divide-y divide-line">
          {[
            ["Privacy", "Voice audio is processed for live transcription and is not stored afterward. VoiceLearn does not build a voice profile of any learner."],
            ["Consent", "A school or classroom deployment requires parental and institutional consent before any learner uses it."],
            ["Child safeguarding", "The intended audience is secondary-school learners. Content and interactions are scoped to ordinary classroom subjects, with no open-ended or unsupervised conversation."],
            ["Transparency", "Learners are told they are speaking with an automated system, and speech recognition or reasoning can occasionally get something wrong. Manual text entry is always available as a fallback."],
            ["Teacher oversight", "VoiceLearn is meant to support a teacher's work, not replace their judgment. It is not used for grading, admissions, or disciplinary decisions."],
            ["Honest limitations", "It currently covers a narrow set of secondary curriculum topics, and says so plainly when a question falls outside them, rather than guessing."],
          ].map(([title, desc]) => (
            <div key={title} className="py-4 flex flex-col sm:flex-row sm:gap-6">
              <dt className="text-sm font-medium text-ink sm:w-40 shrink-0">{title}</dt>
              <dd className="text-sm text-ink-soft leading-relaxed mt-1 sm:mt-0">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-line">
        <div>
          <p className="font-medium text-ink text-sm">See it in practice</p>
          <p className="text-xs text-ink-muted mt-0.5">Ask a real question across math, science, or English.</p>
        </div>
        <Link
          href="/learn"
          className="rounded-xl bg-indigo text-paper px-5 py-2.5 text-sm font-medium hover:bg-indigo-soft transition-colors shrink-0"
        >
          Start learning
        </Link>
      </div>
    </div>
  );
}
