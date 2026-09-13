import { LearningSession, Interaction, TutorResponse, AssessmentResult } from "./schema";
import { extractIntent } from "./intent";
import { generateTutorResponse, pickLadderStep } from "./reasoning";
import { assessAnswer } from "./assessment";
import { adaptSession } from "./adaptation";
import { findConceptById, findConceptByTranscript, Concept } from "./curriculum";

/**
 * Turn-boundary classification.
 *
 * BUG THIS FIXES (original report): previously, once a session had an
 * active topic/concept, every subsequent transcript was unconditionally
 * treated as "the learner is answering the pending ladder question" —
 * regardless of what the learner actually said. A brand-new, unrelated
 * question (e.g. asking about evaporation right after a photosynthesis
 * explanation) was fed into `assessAnswer` against the *old* concept,
 * which naturally scored as wrong, and the reasoning stage then
 * regenerated a response from that same *old* concept — so the learner
 * saw the old topic's explanation and follow-up question again,
 * verbatim, in response to an unrelated new question.
 *
 * HARDENING PASS: the first fix used curriculum-concept matching as one
 * of the two signals for "this is a new topic". That is wrong on its
 * own — a learner can ask about a concept the curriculum has never
 * heard of ("Why do clouds look white?"), and that must still be
 * recognized as a new topic rather than assessed as a wrong answer to
 * whatever was previously active. Curriculum matching is now used only
 * to *improve* classification when it's available (a matched concept
 * that differs from the active one is an unambiguous topic switch); it
 * is never required for new-topic detection.
 *
 * `classifyRelation` computes an explicit `ConversationRelation` for
 * the incoming transcript using, in order: recognized-different-concept
 * match, question/interrogative structure, anaphoric reference (does
 * the utterance refer back to something, or introduce a new subject?),
 * and whether a topic is even active to refer back to. This is a
 * deterministic, curriculum-agnostic heuristic — it does not do
 * semantic/embedding-based topic-shift detection, and that limitation is
 * documented in the engineering report rather than hidden.
 */
export type ConversationRelation =
  | "new_topic"
  | "continuation"
  | "answer_to_previous"
  | "ambiguous";

function readsAsQuestion(transcript: string): boolean {
  const trimmed = transcript.trim();
  if (trimmed.length === 0) return false;
  const hasQuestionMark = /\?\s*$/.test(trimmed);
  const startsWithInterrogative =
    /^(what|why|how|when|where|which|who|does|is|are|can|could|explain|define)\b/i.test(trimmed);
  // Declarative "topic-seeking" phrasing — the learner is clearly asking
  // to be taught about something, just without interrogative grammar
  // ("I want to learn about photosynthesis.", "Tell me about evaporation.").
  const isTopicSeeking = TOPIC_SEEKING_PATTERN.test(trimmed);
  return hasQuestionMark || startsWithInterrogative || isTopicSeeking;
}

/** Phrases that ask to be taught about a subject without using question
 * grammar. Deliberately narrow (verb + "about") to avoid false-positiving
 * on ordinary answers that happen to contain a word like "explain". */
const TOPIC_SEEKING_PATTERN =
  /\b(i want to (learn|know) about|tell me about|teach me about|i'?d like to (know|learn) about|can you (explain|tell) me about)\b/i;

/** Explicit signals that the learner is done with the current topic and
 * wants to move to something else. This is a strong, curriculum-independent
 * override: even if the new subject matches nothing in the curriculum and
 * isn't phrased as a classic question, an explicit "leave that, let's do X"
 * must never be scored as an answer to the topic being abandoned. */
const TOPIC_ABANDON_PATTERN =
  /\b(leave that|forget that|never ?mind that|drop that|let'?s (move on|talk about)|change (the )?(subject|topic)|different topic|another topic|next question)\b/i;

/** A bare "yes"/"no"-style token with nothing else to anchor it. With no
 * active topic to answer, this genuinely has no antecedent ("yes" to
 * what?) — the ambiguous case from the classification brief — whereas
 * with an active topic it is a normal (possibly wrong) answer attempt,
 * handled by the answer_to_previous branch instead. */
const BARE_AFFIRMATION_PATTERN = /^(yes|yeah|yep|yup|sure|okay|ok|alright|no|nah|nope)\.?!?$/i;

/** Pronoun/connective markers that anchor a question to something already
 * being discussed ("it", "this", "so ...") rather than introducing a
 * brand-new subject. This is the signal that separates a legitimate
 * continuation ("Does IT happen before boiling?") from a new,
 * unrelated question ("Why do clouds look white?") when neither matches
 * a curriculum concept. */
function hasAnaphoricReference(transcript: string): boolean {
  const trimmed = transcript.trim();
  return /\b(it|this|that|these|those)\b/i.test(trimmed) || /^(so|and|also|then|but)\b/i.test(trimmed);
}

export function classifyRelation(
  transcript: string,
  session: LearningSession,
  hasActiveTopic: boolean,
): ConversationRelation {
  const trimmed = transcript.trim();

  // Explicit "I'm done with this topic" phrasing overrides everything
  // else — it's a stronger, more direct signal than question structure
  // or curriculum matching, and must never be scored as an answer to
  // the topic being abandoned, known concept or not.
  if (hasActiveTopic && TOPIC_ABANDON_PATTERN.test(trimmed)) {
    return "new_topic";
  }

  const matchedConcept = findConceptByTranscript(trimmed);
  const isQuestion = readsAsQuestion(trimmed);

  if (matchedConcept) {
    if (!hasActiveTopic || matchedConcept.id !== session.concept) {
      // A curriculum concept was recognized, and it isn't the one
      // already active (or nothing was active) — an unambiguous topic
      // switch/start. Curriculum matching IMPROVES this classification
      // but, per the branches below, is never REQUIRED to reach
      // "new_topic".
      return "new_topic";
    }
    // Same concept matched again — e.g. the learner's transcript happens
    // to repeat a trigger keyword ("evaporation") while that topic is
    // already active. An anaphoric follow-up ("So what's the difference
    // between evaporation and boiling?") is a continuation and must keep
    // the existing progress; a plain restated question ("What is
    // evaporation?") with no such reference is treated as a deliberate
    // restart of that topic rather than an answer attempt.
    if (!isQuestion) return "answer_to_previous";
    return hasAnaphoricReference(trimmed) ? "continuation" : "new_topic";
  }

  if (!isQuestion) {
    // Doesn't read as a question at all — the answer-likely case
    // ("Forty-two.", "Heat makes the water molecules move faster.").
    if (hasActiveTopic) return "answer_to_previous";
    // No active topic, and a bare "Yes."/"No." has nothing to affirm or
    // deny — genuinely ambiguous rather than a new (empty) topic.
    if (BARE_AFFIRMATION_PATTERN.test(trimmed)) return "ambiguous";
    return "new_topic";
  }

  // Reads as a question, but doesn't match any known curriculum concept.
  // Curriculum-independent new-topic detection: does it anchor back to
  // something already being discussed, or introduce an unrelated
  // subject (clouds, rainbows, thunder, metal — none of which the
  // curriculum needs to know about for this classification to work)?
  if (hasAnaphoricReference(trimmed)) {
    return hasActiveTopic ? "continuation" : "ambiguous";
  }

  return "new_topic";
}

/** Fresh, untouched topic/concept/progress fields — used when a genuine
 * topic switch is detected, since difficulty/attempts/misconceptions
 * tracked so far belong to the OLD concept and must not carry over to
 * the new one. */
function resetTopicState(session: LearningSession): LearningSession {
  return {
    ...session,
    topic: "",
    concept: "",
    difficulty: 1,
    attempts: 0,
    correctAttempts: 0,
    misconceptions: [],
    masteryEstimateLabel: "Not yet estimated",
  };
}

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
  conversationRelation: ConversationRelation;
}

export function processLearnerTurn(
  session: LearningSession,
  transcript: string,
): TurnResult {
  const hasActiveTopic = session.topic !== "" && session.concept !== "";
  const relation = classifyRelation(transcript, session, hasActiveTopic);

  if (relation === "ambiguous") {
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
      understandingSummary:
        "That seems to refer back to something, but there's no earlier topic in this conversation to connect it to — could you say specifically what you're asking about?",
      conversationRelation: relation,
    };
  }

  if (relation === "new_topic") {
    // Not an answer to the pending question — clear the stale
    // topic/concept before running this as a fresh turn so the old
    // concept can never leak into this turn's response, or into how
    // the NEXT turn is classified.
    return {
      ...processFreshTurn(hasActiveTopic ? resetTopicState(session) : session, transcript),
      conversationRelation: relation,
    };
  }

  // relation is "continuation" or "answer_to_previous" — both are
  // routed through the same pending-question pipeline: `continuation`
  // means the learner's follow-up still concerns the active concept
  // (assessed/re-explained against it, preserving topic + progress);
  // `answer_to_previous` means it's a direct attempt at the ladder
  // question. Distinguishing them further would require open-ended
  // Q&A the curriculum doesn't model yet (see engineering report).
  if (hasActiveTopic) {
    const concept = findConceptById(conceptIdFromSession(session));
    if (!concept) {
      // Session state pointed at a concept we can no longer resolve —
      // fail safe by starting a fresh turn instead of crashing.
      return { ...processFreshTurn(session, transcript), conversationRelation: relation };
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
      conversationRelation: relation,
    };
  }

  return { ...processFreshTurn(session, transcript), conversationRelation: relation };
}

function processFreshTurn(session: LearningSession, transcript: string): Omit<TurnResult, "conversationRelation"> {
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
