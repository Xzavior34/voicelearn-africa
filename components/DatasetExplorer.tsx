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
    { id: "all", label: "All", count: samples.length },
    { id: "standard_english", label: "Standard English", count: samples.filter((s) => s.category === "standard_english").length },
    { id: "nigerian_pidgin", label: "Nigerian Pidgin", count: samples.filter((s) => s.category === "nigerian_pidgin").length },
    { id: "educational_code_switching", label: "English + Pidgin", count: samples.filter((s) => s.category === "educational_code_switching" || s.category === "english_pidgin").length },
    { id: "english_yoruba", label: "English + Yoruba", count: samples.filter((s) => s.category === "english_yoruba").length },
  ];

  const filteredSamples = samples.filter((sample) => {
    let matchesCategory = selectedCategory === "all";
    if (selectedCategory === "standard_english") matchesCategory = sample.category === "standard_english";
    else if (selectedCategory === "nigerian_pidgin") matchesCategory = sample.category === "nigerian_pidgin";
    else if (selectedCategory === "educational_code_switching") matchesCategory = sample.category === "educational_code_switching" || sample.category === "english_pidgin";
    else if (selectedCategory === "english_yoruba") matchesCategory = sample.category === "english_yoruba";

    const matchesSearch =
      searchQuery === "" ||
      sample.referenceTranscript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sample.expectedConceptId && sample.expectedConceptId.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink font-medium">
            Evaluation Dataset Explorer ({samples.length} Samples)
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Hand-reviewed educational speech samples across 4 language tiers and 6 secondary subjects.
          </p>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transcript, topic or ID…"
          className="w-full sm:w-64 rounded-xl border border-line px-3.5 py-1.5 text-xs bg-paper-card text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-indigo"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-indigo text-paper"
                : "bg-paper-subtle text-ink-soft hover:text-ink border border-line/60"
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-line rounded-xl bg-paper-card">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-paper-subtle/80 border-b border-line text-ink font-semibold">
              <th className="px-3.5 py-2.5">ID</th>
              <th className="px-3.5 py-2.5">Reference transcript</th>
              <th className="px-3.5 py-2.5">Subject</th>
              <th className="px-3.5 py-2.5">Language Tier</th>
              <th className="px-3.5 py-2.5">Audio Status</th>
              <th className="px-3.5 py-2.5">Target Concept</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {filteredSamples.map((sample) => (
              <tr key={sample.id} className="hover:bg-paper/80 transition-colors">
                <td className="px-3.5 py-2.5 font-mono text-ink-muted font-medium">{sample.id}</td>
                <td className="px-3.5 py-2.5 font-serif text-ink italic max-w-md">&ldquo;{sample.referenceTranscript}&rdquo;</td>
                <td className="px-3.5 py-2.5 capitalize font-medium text-ink">{sample.subject}</td>
                <td className="px-3.5 py-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-paper-subtle text-ink-soft border border-line/70 text-[11px] font-mono">
                    {sample.languagePair}
                  </span>
                </td>
                <td className="px-3.5 py-2.5">
                  {sample.audioFilePath ? (
                    <span className="text-[11px] text-leaf font-medium">Physical WAV</span>
                  ) : (
                    <span className="text-[11px] text-ink-muted">Awaiting Audio</span>
                  )}
                </td>
                <td className="px-3.5 py-2.5 font-mono text-[11px] text-indigo">{sample.expectedConceptId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
