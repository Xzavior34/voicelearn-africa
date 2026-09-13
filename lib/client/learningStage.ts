/**
 * Derives the learner-facing "learning stage" from the same real state
 * VoiceTutor already tracks (phase, recorder status, session/history) —
 * it does not introduce a second, competing state machine. This exists
 * as a plain, framework-free function specifically so the mapping from
 * "what the app is actually doing" to "what moment the learner is in"
 * can be unit-tested without a DOM/React test harness.
 *
 * This is a presentation-layer concept only: it never changes what
 * request is sent, what the tutor answers, or how assessment/adaptation
 * work — those remain exactly as implemented in lib/tutor/session.ts.
 */

export type Phase =
  | "idle"
  | "recording"
  | "processing_speech"
  | "speech_unavailable"
  | "processing_tutor"
  | "responded"
  | "tutor_failed";

export type RecorderStatusLike =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "stopped"
  | "permission_denied"
  | "unsupported"
  | "error";

export type LearningStage =
  | "curious" // no active learning moment — inviting a question
  | "listening"
  | "understanding" // processing a brand-new question
  | "teaching" // an explanation + follow-up was just delivered
  | "assessing" // processing the learner's answer to a pending question
  | "success"
  | "retry"
  | "error";

export interface LearningStageInput {
  phase: Phase;
  recorderStatus: RecorderStatusLike;
  historyLength: number;
  /** Whether a topic was already active before this turn — i.e. whether
   * the current/most recent submission was answering a pending question
   * rather than asking something new. */
  isFollowUp: boolean;
  /** The most recently completed turn's assessment outcome, if any. */
  latestAssessmentOutcome?: string | null;
  /** Whether the most recently completed turn actually produced a
   * tutor explanation (false for an unrecognized/out-of-curriculum
   * question, which has nothing to "teach"). */
  latestHasTutorResponse?: boolean;
}

export function deriveLearningStage({
  phase,
  recorderStatus,
  historyLength,
  isFollowUp,
  latestAssessmentOutcome,
  latestHasTutorResponse,
}: LearningStageInput): LearningStage {
  if (phase === "tutor_failed" || recorderStatus === "error" || recorderStatus === "permission_denied") {
    return "error";
  }

  if (recorderStatus === "recording") {
    return "listening";
  }

  const isBusy = phase === "processing_speech" || phase === "processing_tutor";
  if (isBusy) {
    return isFollowUp ? "assessing" : "understanding";
  }

  if (historyLength === 0) {
    return "curious";
  }

  if (latestAssessmentOutcome === "correct") {
    return "success";
  }
  if (latestAssessmentOutcome) {
    return "retry";
  }
  if (!latestHasTutorResponse) {
    // Nothing was actually taught (out-of-curriculum question) — there's
    // no learning moment to be "in"; invite another question instead.
    return "curious";
  }

  return "teaching";
}
