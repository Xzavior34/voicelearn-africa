import type { Metadata } from "next";
import Link from "next/link";
import { CURRICULUM } from "@/lib/tutor/curriculum";

export const metadata: Metadata = {
  title: "Progress & Curriculum Map — Regamos VoiceLearn",
  description: "Explore the verified secondary curriculum concept roadmap, mastery ladders, and practice paths.",
};

export default function ProgressPage() {
  const mathConcepts = CURRICULUM.filter((c) => c.subject === "mathematics");
  const scienceConcepts = CURRICULUM.filter((c) => c.subject === "science");
  const englishConcepts = CURRICULUM.filter((c) => c.subject === "english");

  const groups = [
    { title: "Mathematics", icon: "📐", badge: "bg-indigo-light text-indigo", concepts: mathConcepts },
    { title: "Science & Biology", icon: "🌿", badge: "bg-leaf-light text-leaf", concepts: scienceConcepts },
    { title: "English Language", icon: "📖", badge: "bg-ochre-light text-ochre", concepts: englishConcepts },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-12">
      {/* 1. Header */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-light text-indigo text-xs font-semibold w-fit border border-indigo-border/60">
          <span className="h-2 w-2 rounded-full bg-indigo" aria-hidden="true" />
          <span>Curriculum Mastery &middot; Socratic Progression</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl text-ink font-semibold tracking-tight">
          Building mastery, one concept at a time.
        </h1>
        <p className="text-ink-soft text-base sm:text-lg leading-relaxed max-w-2xl">
          Rather than reducing learning to a high-stakes score, VoiceLearn tracks understanding across five difficulty levels, diagnostic misconception resolution, and active recall.
        </p>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-line bg-paper-card">
          <p className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Curriculum Topics</p>
          <p className="text-2xl font-display font-semibold text-ink mt-1">9 Core Concepts</p>
          <p className="text-[11px] text-ink-muted mt-0.5">Aligned with WAEC/BECE</p>
        </div>
        <div className="p-4 rounded-2xl border border-line bg-paper-card">
          <p className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Mastery Ladder</p>
          <p className="text-2xl font-display font-semibold text-leaf mt-1">5 Levels</p>
          <p className="text-[11px] text-ink-muted mt-0.5">Dynamic step adaptation</p>
        </div>
        <div className="p-4 rounded-2xl border border-line bg-paper-card">
          <p className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Intent Precision</p>
          <p className="text-2xl font-display font-semibold text-indigo mt-1">79.3%</p>
          <p className="text-[11px] text-ink-muted mt-0.5">Deterministic intent matching</p>
        </div>
        <div className="p-4 rounded-2xl border border-line bg-paper-card">
          <p className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Real Speech WER</p>
          <p className="text-2xl font-display font-semibold text-ochre mt-1">3.6%</p>
          <p className="text-[11px] text-ink-muted mt-0.5">Intron Sahara v2.5 live</p>
        </div>
      </div>

      {/* 3. Subject Domains & Interactive Topic Cards */}
      <div className="flex flex-col gap-10">
        {groups.map((group) => (
          <section key={group.title} className="flex flex-col gap-5 pt-6 border-t border-line">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl" aria-hidden="true">{group.icon}</span>
                <h2 className="font-display text-xl sm:text-2xl text-ink font-semibold">{group.title}</h2>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${group.badge}`}>
                {group.concepts.length} {group.concepts.length === 1 ? "concept" : "concepts"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.concepts.map((concept) => (
                <div
                  key={concept.id}
                  className="p-5 rounded-3xl border border-line bg-paper-card/70 flex flex-col justify-between gap-4 shadow-2xs hover:border-indigo-border/60 transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">{concept.topic}</span>
                      <span className="font-mono text-ink-muted">Ladder: {concept.ladder.length} Steps</span>
                    </div>
                    <h3 className="font-display text-base sm:text-lg text-ink font-semibold group-hover:text-indigo transition-colors">
                      {concept.concept}
                    </h3>
                    <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                      {concept.explanation}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line/60 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {concept.ladder.map((_, stepIdx) => (
                        <span
                          key={stepIdx}
                          className="h-1.5 w-4 rounded-full bg-indigo/25 group-hover:bg-indigo transition-colors"
                          title={`Level ${stepIdx + 1}`}
                        />
                      ))}
                    </div>
                    <Link
                      href={`/learn?prompt=${encodeURIComponent(concept.triggerPhrases[0] || concept.concept)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo hover:text-indigo-soft transition-colors"
                    >
                      <span>Practise with voice</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 4. CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-line bg-paper-subtle/40 p-8 rounded-3xl">
        <div>
          <p className="font-display text-xl text-ink font-semibold">Ready to test your active recall?</p>
          <p className="text-xs text-ink-soft mt-1">Launch the voice tutor and ask any concept in English or Nigerian Pidgin.</p>
        </div>
        <Link
          href="/learn"
          className="rounded-full bg-indigo text-paper px-6 py-3.5 text-sm font-semibold hover:bg-indigo-soft transition-all shadow-sm active:scale-[0.98] shrink-0"
        >
          Open Voice Tutor
        </Link>
      </div>
    </div>
  );
}
