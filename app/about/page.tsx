import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — VoiceLearn Africa",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-12 flex flex-col gap-10 text-ink-soft leading-relaxed">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl text-ink">About VoiceLearn Africa</h1>
        <p>
          An adaptive voice-learning system designed around African code-switched speech — built
          for the Intron Sahara CodeSwitch Africa Challenge by the Regamos Foundation.
        </p>
      </div>

      <section className="flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="font-display text-xl text-ink">The problem</h2>
        <p>
          African secondary-school learners frequently mix languages naturally while asking
          questions — moving between English and Nigerian Pidgin (or other local languages)
          within a single sentence. Speech systems built around standardized, monolingual speech
          can lose meaning exactly when a learner communicates the way they naturally would.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="font-display text-xl text-ink">Why this isn&apos;t just transcription</h2>
        <p>
          A conventional voice assistant goes speech → text → answer. VoiceLearn goes speech →
          code-switch understanding → learning intent → teaching → assessment → adaptation. The
          transcript is an intermediate step, not the product — what matters is whether the
          system correctly identifies what the learner needs help with, teaches it, checks
          understanding, and adjusts.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="font-display text-xl text-ink">Responsible AI</h2>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>
            <span className="text-ink font-medium">Privacy:</span> voice is sensitive,
            biometric-adjacent data. This build does not persist recordings — audio is processed
            in memory for a single request and discarded.
          </li>
          <li>
            <span className="text-ink font-medium">Children:</span> the product targets
            secondary-school learners. This build has not been tested with children, has no
            school pilot, and makes no such claim. Any real deployment should include teacher or
            guardian oversight.
          </li>
          <li>
            <span className="text-ink font-medium">Scope:</span> VoiceLearn is an educational
            assistant. It does not make medical, legal, disciplinary, admissions, or financial
            decisions.
          </li>
          <li>
            <span className="text-ink font-medium">AI disclosure:</span> VoiceLearn uses AI to
            assist learning and may occasionally misunderstand speech or educational context —
            every response path has a recovery option to try again.
          </li>
          <li>
            <span className="text-ink font-medium">Honesty:</span> we do not fabricate benchmark
            scores, user counts, school partnerships, or deployment status. See{" "}
            <code className="font-mono">COMPETITION_EVIDENCE.md</code> for exactly what is
            verified versus proposed.
          </li>
        </ul>
        <p className="pt-2">
          Full documentation: <code className="font-mono">RESPONSIBLE_AI.md</code>.
        </p>
      </section>
    </div>
  );
}
