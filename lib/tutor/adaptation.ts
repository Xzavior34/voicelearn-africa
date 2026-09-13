import { AssessmentResult, LearningSession } from "./schema";

/**
 * Stage 4: adaptation.
 *
 * Pure function: (previous session, latest assessment) -> next session
 * state. This is what makes the tutor's NEXT question depend on the
 * learner's PREVIOUS answer — the core "downstream task" the
 * competition brief requires, not just "speech -> text".
 */
export function adaptSession(
  session: LearningSession,
  assessment: AssessmentResult,
): LearningSession {
  const attempts = session.attempts + 1;
  const correctAttempts =
    session.correctAttempts + (assessment.outcome === "correct" ? 1 : 0);

  let difficulty = session.difficulty;
  if (assessment.outcome === "correct") {
    difficulty = Math.min(5, session.difficulty + 1);
  } else if (assessment.outcome === "incorrect_misconception" || assessment.outcome === "incorrect_other") {
    difficulty = Math.max(1, session.difficulty - 1);
  }
  // "partially_correct" and "uncertain" hold difficulty steady rather
  // than punish or reward — we re-teach at the same level.

  const misconceptions = [...session.misconceptions];
  if (assessment.detectedMisconception && !misconceptions.includes(assessment.detectedMisconception)) {
    misconceptions.push(assessment.detectedMisconception);
  }

  const accuracy = attempts > 0 ? correctAttempts / attempts : 0;
  const masteryEstimateLabel =
    attempts < 2
      ? "Not enough attempts yet"
      : accuracy >= 0.8
        ? "Learning estimate: likely secure on this concept"
        : accuracy >= 0.5
          ? "Learning estimate: developing understanding"
          : "Learning estimate: needs more support on this concept";

  return {
    ...session,
    attempts,
    correctAttempts,
    difficulty,
    misconceptions,
    masteryEstimateLabel,
  };
}
