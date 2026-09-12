import { LearningSession, Interaction, TutorResponse, AssessmentResult } from "./schema";
import { extractIntent } from "./intent";
import { generateTutorResponse, pickLadderStep } from "./reasoning";
import { assessAnswer } from "./assessment";
import { adaptSession } from "./adaptation";
import { findConceptById, Concept } from "./curriculum";

/**
 * Orchestrates one full learner turn through all four tutor stages:
 * intent extraction -> reasoning -> (if this is a follow-up) assessment
 * -> adaptation. This is the ONLY place that wires the stages
 * together; each stage module above has no dependency on the others
 * being called in any particular way, which is what keeps them
 * independently unit-testable.
 */
export interface TurnResult {
  session: LearningSession;
  tutorResponse: TutorResponse | null;
  assessment: AssessmentResult | null;
  understandingSummary: string;
}

export function processLearnerTurn(
  session: LearningSession,
  transcript: string,
): TurnResult {
  const isFollowUpAnswer = session.topic !== "" && session.concept !== "";

  if (isFollowUpAnswer) {
    const concept = findConceptById(conceptIdFromSession(session));
    if (!concept) {
      // Session state pointed at a concept we can no longer resolve —
      // fail safe by starting a fresh turn instead of crashing.
      return processFreshTurn(session, transcript);
    }
    const step = pickLadderStep(concept, session.difficulty);
    const assessment = assessAnswer(concept, step, transcript);
    const adapted = adaptSession(session, assessment);
    const nextTutorResponse = generateTutorResponse(concept, "conceptual_question", adapted.difficulty);

    const interaction: Interaction = {
      learnerTranscript: transcript,
      assessment,
      tutorResponse: nextTutorResponse,
      timestamp: Date.now(),
    };

    return {
      session: {
        ...adapted,
        interactionHistory: [...adapted.interactionHistory, interaction],
      },
      tutorResponse: nextTutorResponse,
      assessment,
      understandingSummary: `Assessed answer to previous question (${assessment.outcome}).`,
    };
  }

  return processFreshTurn(session, transcript);
}

function processFreshTurn(session: LearningSession, transcript: string): TurnResult {
  const { understanding, matchedConcept } = extractIntent(transcript);

  if (!matchedConcept) {
    const interaction: Interaction = {
      learnerTranscript: transcript,
      timestamp: Date.now(),
    };
    return {
      session: {
        ...session,
        interactionHistory: [...session.interactionHistory, interaction],
      },
      tutorResponse: null,
      assessment: null,
      understandingSummary: "Could not match this to a topic in the current curriculum.",
    };
  }

  const tutorResponse = generateTutorResponse(
    matchedConcept,
    understanding.learningNeed,
    session.difficulty || 1,
  );

  const interaction: Interaction = {
    learnerTranscript: transcript,
    tutorResponse,
    timestamp: Date.now(),
  };

  const nextSession: LearningSession = {
    ...session,
    topic: matchedConcept.topic,
    concept: matchedConcept.id, // store id internally for lookup; UI reads `understanding.concept` for display text
    languagePattern: understanding.languageNote,
    interactionHistory: [...session.interactionHistory, interaction],
  };

  return {
    session: nextSession,
    tutorResponse,
    assessment: null,
    understandingSummary: `${understanding.topic} — ${understanding.learningNeed.replace("_", " ")}`,
  };
}

function conceptIdFromSession(session: LearningSession): string {
  return session.concept;
}

export function resolveConcept(session: LearningSession): Concept | undefined {
  return findConceptById(session.concept);
}
