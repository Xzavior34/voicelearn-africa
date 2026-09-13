import { Understanding, LearningNeed } from "./schema";
import { findConceptByTranscript, Concept } from "./curriculum";

/**
 * Stage 1: educational intent extraction.
 *
 * Takes the raw (possibly code-switched) transcript from the speech
 * provider and determines WHAT the learner is asking for and WHICH
 * curriculum concept it maps to. This is deliberately separate from
 * speech understanding (lib/speech) and from tutor reasoning
 * (lib/tutor/reasoning.ts) — a different transcript source (Sahara vs.
 * a comparison model) can be dropped in without touching this file,
 * and this file's output feeds reasoning without reasoning needing to
 * know anything about how the transcript was produced.
 */

const CLARIFICATION_MARKERS = ["i understand say", "i understand that", "but why", "i no understand"];
const PRACTICE_MARKERS = ["give me another", "one more question", "test me", "try another"];

function detectLearningNeed(transcript: string): LearningNeed {
  const lower = transcript.toLowerCase();
  if (CLARIFICATION_MARKERS.some((m) => lower.includes(m))) return "clarification";
  if (PRACTICE_MARKERS.some((m) => lower.includes(m))) return "practice_request";
  if (lower.includes("how i fit") || lower.includes("how do i") || lower.includes("how can i")) {
    return "procedural_question";
  }
  return "conceptual_question";
}

function describeLanguagePattern(transcript: string): string {
  const pcmMarkers = ["dey", "wetin", "fit", "no dey", "abeg", "sef", "wey", "go give"];
  const lower = transcript.toLowerCase();
  const hasPcm = pcmMarkers.some((m) => lower.includes(m));
  const hasEnglishStructure = /\b(the|is|are|what|why|how)\b/i.test(transcript);
  if (hasPcm && hasEnglishStructure) return "Mixed English + Nigerian Pidgin (code-switched)";
  if (hasPcm) return "Nigerian Pidgin";
  return "Standard English";
}

export interface IntentExtractionResult {
  understanding: Understanding;
  matchedConcept: Concept | null;
}

export function extractIntent(transcript: string): IntentExtractionResult {
  const trimmed = transcript.trim();
  const matchedConcept = findConceptByTranscript(trimmed);
  const learningNeed = detectLearningNeed(trimmed);
  const languageNote = describeLanguagePattern(trimmed);

  if (!matchedConcept) {
    return {
      understanding: {
        topic: "Unrecognized topic",
        concept:
          "Not in current curriculum (mathematics: signed multiplication, division by zero; " +
          "science: photosynthesis, evaporation, friction, dissolving; english: main idea, affect vs effect)",
        learningNeed,
        languageNote,
        confidence: null,
      },
      matchedConcept: null,
    };
  }

  return {
    understanding: {
      topic: matchedConcept.topic,
      concept: matchedConcept.concept,
      learningNeed,
      languageNote,
      // Deterministic keyword match — reporting a confidence number here
      // would be fabricated. We report null and let the UI say so.
      confidence: null,
    },
    matchedConcept,
  };
}
