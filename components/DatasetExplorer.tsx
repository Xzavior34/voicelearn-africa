"use client";

import { useState } from "react";
import { BenchmarkSample } from "@/lib/benchmark/dataset/types";

interface Props {
  samples: BenchmarkSample[];
}

export default function DatasetExplorer({ samples }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "All Samples", count: samples.length },
    { id: "standard_english", label: "Standard English", count: samples.filter((s) => s.category === "standard_english").length },
    { id: "english_pidgin", label: "English + Pidgin", count: samples.filter((s) => s.category === "english_pidgin").length },
    { id: "educational_code_switching", label: "Code-Switching", count: samples.filter((s) => s.category === "educational_code_switching").length },
    { id: "subject_vocabulary", label: "Subject Vocab", count: samples.filter((s) => s.category === "subject_vocabulary").length },
    { id: "noisy_environment", label: "Noisy/Background", count: samples.filter((s) => s.category === "noisy_environment").length },
    { id: "fast_speech", label: "Fast Speech", count: samples.filter((s) => s.category === "fast_speech").length },
  ];

  const filteredSamples = samples.filter((sample) => {
    const matchesCategory = selectedCategory === "all" || sample.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      sample.referenceTranscript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="rounded-2xl border border-line bg-paper-card p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink font-semibold">
            Evaluation Dataset Inspector ({samples.length} Samples)
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Hand-authored curriculum samples across secondary Mathematics, Science, and English.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript or topic…"
            className="w-full rounded-xl border border-line px-3.5 py-1.5 text-xs bg-paper text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-indigo"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === cat.id
                ? "bg-indigo text-paper shadow-2xs"
                : "bg-paper-subtle text-ink-soft hover:text-ink hover:bg-paper-elevated border border-line/60"
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Samples Table */}
      <div className="overflow-x-auto border border-line rounded-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-paper-subtle/80 border-b border-line text-ink font-semibold">
              <th className="px-3.5 py-2.5">ID</th>
              <th className="px-3.5 py-2.5">Reference Transcript</th>
              <th className="px-3.5 py-2.5">Subject</th>
              <th className="px-3.5 py-2.5">Category</th>
              <th className="px-3.5 py-2.5">Language</th>
              <th className="px-3.5 py-2.5">Expected Concept</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {filteredSamples.map((sample) => (
              <tr key={sample.id} className="hover:bg-paper/80 transition-colors">
                <td className="px-3.5 py-2.5 font-mono text-ink-muted font-medium shrink-0">
                  {sample.id}
                </td>
                <td className="px-3.5 py-2.5 font-serif text-ink italic max-w-sm">
                  &ldquo;{sample.referenceTranscript}&rdquo;
                </td>
                <td className="px-3.5 py-2.5 capitalize font-medium text-ink">
                  {sample.subject}
                </td>
                <td className="px-3.5 py-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-paper-subtle text-ink-soft border border-line/70 text-[11px]">
                    {sample.category.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 font-mono text-[11px] text-ink-muted">
                  {sample.languagePair}
                </td>
                <td className="px-3.5 py-2.5 font-mono text-[11px] text-indigo">
                  {sample.expectedConceptId ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
