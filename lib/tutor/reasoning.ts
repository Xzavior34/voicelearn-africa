import { Concept } from "./curriculum";
import { TutorResponse, TutorResponseSchema, LearningNeed } from "./schema";

/**
 * Stage 2: tutor reasoning.
 *
 * Given a matched curriculum concept and the current difficulty level
 * for this session, produces a structured, schema-validated
 * TutorResponse — never raw unchecked text. `pickLadderStep` is what
 * makes the tutor's question depend on session state (difficulty)
 * rather than always asking the same thing.
 */

export function pickLadderStep(concept: Concept, difficulty: number) {
  // Find the closest available step at or below the requested difficulty,
  // falling back to the easiest step. Concepts have a short ladder (1-4
  // steps), not all five difficulty levels.
  const sorted = [...concept.ladder].sort((a, b) => a.difficulty - b.difficulty);
  const atOrBelow = sorted.filter((s) => s.difficulty <= difficulty);
  return atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1] : sorted[0];
}

export function generateTutorResponse(
  concept: Concept,
  learningNeed: LearningNeed,
  difficulty: number,
): TutorResponse {
  const step = pickLadderStep(concept, difficulty);
  const explanationText =
    learningNeed === "clarification"
      ? `${concept.explanation} ${concept.example}`
      : concept.explanation;

  const response: TutorResponse = {
    intent: learningNeed,
    topic: concept.topic,
    explanation: explanationText,
    followUpQuestion: step.question,
    expectedAnswer: step.expectedAnswer,
    nextDifficulty: step.difficulty,
  };

  // Validate before returning — this is the "never render arbitrary
  // output unchecked" boundary the brief calls for. Since this response
  // is built from our own typed curriculum data it will always pass,
  // but the check remains so a future LLM-backed reasoning engine can
  // be swapped in behind this exact function signature safely.
  return TutorResponseSchema.parse(response);
}
