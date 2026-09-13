import { Concept } from "./curriculum";
import { DifficultyStep } from "./curriculum";
import { AssessmentResult, AssessmentResultSchema } from "./schema";

/**
 * Stage 3: assessment.
 *
 * Deliberately NOT exact-text comparison (the brief explicitly warns
 * against that). We normalize the learner's spoken answer (numerals
 * spelled out, filler words, punctuation) and check it against a list
 * of acceptable phrasings for the current ladder step, then check
 * known misconception patterns before falling back to a generic
 * "incorrect" outcome.
 */

const NUMBER_WORDS: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  twelve: "12",
  "twenty five": "25",
  "twenty-five": "25",
  "fifty six": "56",
  "fifty-six": "56",
};

const UNCERTAINTY_MARKERS = ["i don't know", "i no sabi", "not sure", "maybe", "i think maybe", "no idea"];

export function normalizeAnswer(raw: string): string {
  let text = raw.trim().toLowerCase();
  text = text.replace(/[.,!?]/g, "");
  text = text.replace(/^(it is|it's|the answer is|i think it's|i think it is|na)\s+/, "");
  for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, "g"), digit);
  }
  return text.trim();
}

export function assessAnswer(
  concept: Concept,
  step: DifficultyStep,
  learnerTranscript: string,
): AssessmentResult {
  const lowerRaw = learnerTranscript.trim().toLowerCase();

  if (UNCERTAINTY_MARKERS.some((m) => lowerRaw.includes(m))) {
    const result: AssessmentResult = {
      outcome: "uncertain",
      feedback:
        "That's okay — let's slow down. " + concept.explanation + " Want to try the question again?",
    };
    return AssessmentResultSchema.parse(result);
  }

  const normalized = normalizeAnswer(learnerTranscript);
  const acceptableNormalized = step.acceptableAnswers.map((a) => normalizeAnswer(a));

  // Exact match, or the learner's normalized answer contains a full
  // acceptable phrasing as a substring (handles free-text answers like
  // "it would stop because there's no light energy being captured"
  // containing the acceptable phrasing "it would stop").
  const isCorrect = acceptableNormalized.some(
    (a) => a === normalized || (a.length > 3 && normalized.includes(a)),
  );
  if (isCorrect) {
    const result: AssessmentResult = {
      outcome: "correct",
      feedback: "Correct.",
    };
    return AssessmentResultSchema.parse(result);
  }

  // Check known misconception patterns for this concept.
  for (const [pattern, label] of Object.entries(concept.misconceptions)) {
    if (normalized.includes(normalizeAnswer(pattern))) {
      const result: AssessmentResult = {
        outcome: "incorrect_misconception",
        detectedMisconception: label,
        feedback: `Not quite — it looks like you might ${label}. ${concept.explanation}`,
      };
      return AssessmentResultSchema.parse(result);
    }
  }

  // Partial credit: the answer contains the right idea in some words
  // but doesn't match a full acceptable phrasing (mostly relevant for
  // the free-text science/english concepts, not the numeric math one).
  const looksPartial =
    step.expectedAnswer.split(" ").filter((w) => w.length > 3 && normalized.includes(w.toLowerCase())).length >= 2;
  if (looksPartial) {
    const result: AssessmentResult = {
      outcome: "partially_correct",
      feedback: "You're on the right track, but let's make it more complete. " + concept.explanation,
    };
    return AssessmentResultSchema.parse(result);
  }

  const result: AssessmentResult = {
    outcome: "incorrect_other",
    feedback: "Not quite. " + concept.explanation + " " + concept.example,
  };
  return AssessmentResultSchema.parse(result);
}
