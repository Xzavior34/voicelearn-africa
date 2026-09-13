import { z } from "zod";

/**
 * Strict, validated schemas for everything the tutor engine produces.
 * Per the brief: "Do not blindly render arbitrary model output" —
 * every tutor response is parsed through `TutorResponseSchema` before
 * it reaches the UI, whether it was produced by the deterministic
 * rules engine (current implementation) or a future LLM-backed one.
 */

export const LearningNeedSchema = z.enum([
  "conceptual_question",
  "procedural_question",
  "clarification",
  "practice_request",
]);
export type LearningNeed = z.infer<typeof LearningNeedSchema>;

export const UnderstandingSchema = z.object({
  topic: z.string().min(1),
  concept: z.string().min(1),
  learningNeed: LearningNeedSchema,
  languageNote: z.string().min(1),
  /** Only present if genuinely computed; never fabricated. */
  confidence: z.number().min(0).max(1).nullable(),
});
export type Understanding = z.infer<typeof UnderstandingSchema>;

export const TutorResponseSchema = z.object({
  intent: LearningNeedSchema,
  topic: z.string().min(1),
  explanation: z.string().min(1),
  followUpQuestion: z.string().min(1),
  expectedAnswer: z.string().min(1),
  misconception: z.string().optional(),
  nextDifficulty: z.number().int().min(1).max(5),
});
export type TutorResponse = z.infer<typeof TutorResponseSchema>;

export const AssessmentOutcomeSchema = z.enum([
  "correct",
  "partially_correct",
  "incorrect_misconception",
  "incorrect_other",
  "uncertain",
]);
export type AssessmentOutcome = z.infer<typeof AssessmentOutcomeSchema>;

export const AssessmentResultSchema = z.object({
  outcome: AssessmentOutcomeSchema,
  detectedMisconception: z.string().optional(),
  feedback: z.string().min(1),
});
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

export const InteractionSchema = z.object({
  learnerTranscript: z.string(),
  tutorResponse: TutorResponseSchema.optional(),
  assessment: AssessmentResultSchema.optional(),
  timestamp: z.number(),
});
export type Interaction = z.infer<typeof InteractionSchema>;

export const LearningSessionSchema = z.object({
  topic: z.string(),
  concept: z.string(),
  difficulty: z.number().int().min(1).max(5),
  attempts: z.number().int().min(0),
  correctAttempts: z.number().int().min(0),
  misconceptions: z.array(z.string()),
  languagePattern: z.string().nullable(),
  /** Simple, explicitly-labeled estimate — never presented as validated mastery. */
  masteryEstimateLabel: z.string(),
  interactionHistory: z.array(InteractionSchema),
});
export type LearningSession = z.infer<typeof LearningSessionSchema>;

export function createInitialSession(): LearningSession {
  return {
    topic: "",
    concept: "",
    difficulty: 1,
    attempts: 0,
    correctAttempts: 0,
    misconceptions: [],
    languagePattern: null,
    masteryEstimateLabel: "Not yet estimated",
    interactionHistory: [],
  };
}
