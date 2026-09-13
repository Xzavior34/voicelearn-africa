import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Progress — Regamos VoiceLearn",
  description: "How VoiceLearn represents what a learner has covered and what's next.",
};

const CONCEPTS: { subject: string; items: { label: string; state: "done" | "current" | "upcoming" }[] }[] = [
  {
    subject: "Mathematics",
    items: [
      { label: "Signed number multiplication", state: "done" },
      { label: "Dividing by zero", state: "current" },
      { label: "Fractions", state: "upcoming" },
    ],
  },
  {
    subject: "Science",
    items: [
      { label: "Photosynthesis & chlorophyll", state: "done" },
      { label: "Evaporation", state: "done" },
      { label: "Friction & rolling motion", state: "upcoming" },
      { label: "Why salt dissolves", state: "upcoming" },
    ],
  },
  {
    subject: "English",
    items: [
      { label: "Identifying the main idea", state: "current" },
      { label: "Affect vs. effect", state: "upcoming" },
      { label: "Nouns", state: "upcoming" },
    ],
  },
];

export default function ProgressPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan font-semibold">Progress</p>
        <h1 className="font-display text-3xl sm:text-5xl text-ink font-semibold tracking-tight">
          Building knowledge, one concept at a time.
        </h1>
        <p className="text-ink-soft text-base leading-relaxed prose-measure">
          Instead of a percentage score, VoiceLearn thinks about learning as concepts you&apos;ve
          covered, one you&apos;re currently working through, and what comes next.
        </p>
      </div>

      <div className="rounded-2xl border border-ochre-border bg-ochre-light/50 px-5 py-4 text-sm text-ink-soft">
        <strong className="text-ochre-warm font-semibold">Illustrative example.</strong> This build
        doesn&apos;t yet persist a learner&apos;s progress between visits — each `/learn` session
        starts fresh (see <Link href="/about" className="underline underline-offset-4 hover:text-ink">About</Link> for
        why). The map below shows what this page is designed to represent, not your actual history.
      </div>

      <div className="flex flex-col gap-10">
        {CONCEPTS.map((group) => (
          <div key={group.subject} className="flex flex-col gap-4">
            <h2 className="font-display text-lg text-ink font-medium">{group.subject}</h2>
            <div className="flex flex-col gap-0">
              {group.items.map((item, i) => (
                <div key={item.label} className="flex items-stretch gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-3 w-3 rounded-full shrink-0 mt-1.5 ${
                        item.state === "done"
                          ? "bg-leaf shadow-[0_0_10px_-1px_var(--leaf)]"
                          : item.state === "current"
                            ? "bg-indigo shadow-[0_0_12px_-1px_var(--indigo)]"
                            : "bg-ink-light"
                      }`}
                      aria-hidden="true"
                    />
                    {i < group.items.length - 1 && (
                      <span
                        className={`w-px flex-1 my-1 ${item.state === "done" ? "bg-leaf-border" : "bg-line"}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p
                    className={`pb-6 text-sm ${
                      item.state === "upcoming" ? "text-ink-muted" : "text-ink font-medium"
                    }`}
                  >
                    {item.label}
                    {item.state === "current" && (
                      <span className="ml-2 text-xs text-indigo-soft font-normal">— in progress</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-line">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 rounded-full bg-indigo text-paper px-6 py-3 text-sm font-medium hover:bg-indigo-soft transition-colors shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--indigo)_55%,transparent)]"
        >
          Continue learning
        </Link>
      </div>
    </div>
  );
}
