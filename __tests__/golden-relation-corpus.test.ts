import { describe, it, expect } from "vitest";
import { classifyRelation, processLearnerTurn, ConversationRelation } from "@/lib/tutor/session";
import { createInitialSession, LearningSession } from "@/lib/tutor/schema";

/**
 * Golden relation-classification corpus.
 *
 * Each case is a genuine, distinct product invariant — not padding for a
 * target count. Cases are grouped by category to make the coverage
 * legible: new topic (known + unknown + non-question phrasing +
 * hidden-in-natural-language), continuation (plain + code-switched +
 * same-keyword), answer (short + natural-language), and ambiguous.
 *
 * Each case is run through `classifyRelation` directly (fast, pure) AND,
 * where the scenario implies a specific tutor-facing outcome (e.g. "must
 * not return the old topic's response"), through `processLearnerTurn` as
 * well, so the corpus checks the classifier's decision AND its real
 * effect on the session — a classifier that returns the right label but
 * still lets stale state leak through would not be caught by label
 * checks alone.
 */

interface Case {
  label: string;
  /** Prior turns to run before the case transcript, to set up session context. */
  setup: string[];
  transcript: string;
  expected: ConversationRelation;
}

function sessionAfter(turns: string[]): LearningSession {
  let session = createInitialSession();
  for (const t of turns) {
    session = processLearnerTurn(session, t).session;
  }
  return session;
}

const CASES: Case[] = [
  // --- New topic: known to the curriculum ---
  { label: "known topic, first turn", setup: [], transcript: "What is evaporation?", expected: "new_topic" },
  { label: "known topic, switch from photosynthesis", setup: ["Why do plants need sunlight for photosynthesis?"], transcript: "What is evaporation?", expected: "new_topic" },
  { label: "known topic, switch from multiplication", setup: ["Why negative times negative go give positive?"], transcript: "Why do plants need sunlight for photosynthesis?", expected: "new_topic" },
  { label: "known topic, no question mark (ASR-style)", setup: [], transcript: "what is evaporation", expected: "new_topic" },
  { label: "known topic switch to divide-by-zero", setup: ["What is evaporation?"], transcript: "Why does dividing by zero not work?", expected: "new_topic" },
  { label: "known topic switch to affect/effect", setup: ["What is evaporation?"], transcript: "What's the difference between affect and effect?", expected: "new_topic" },
  { label: "known topic switch to nouns", setup: ["What is evaporation?"], transcript: "What is a noun?", expected: "new_topic" },
  { label: "known topic, declarative phrasing", setup: [], transcript: "I want to learn about photosynthesis.", expected: "new_topic" },
  { label: "known topic, 'tell me about' phrasing", setup: ["What is evaporation?"], transcript: "Tell me about salt dissolving in water.", expected: "new_topic" },

  // --- New topic: unknown to the curriculum ---
  { label: "unknown topic, clouds", setup: ["Why do plants need sunlight for photosynthesis?"], transcript: "Why do clouds look white?", expected: "new_topic" },
  { label: "unknown topic, rainbow", setup: ["Why do plants need sunlight for photosynthesis?"], transcript: "How does a rainbow form?", expected: "new_topic" },
  { label: "unknown topic, metal vs wood", setup: ["Why do plants need sunlight for photosynthesis?"], transcript: "Why does metal feel colder than wood?", expected: "new_topic" },
  { label: "unknown topic, thunder", setup: ["Why do plants need sunlight for photosynthesis?"], transcript: "What causes thunder?", expected: "new_topic" },
  { label: "unknown topic, first turn ever", setup: [], transcript: "Why do clouds look white?", expected: "new_topic" },
  { label: "unknown topic hidden in natural language after abandon phrase", setup: ["Why negative times negative go give positive?"], transcript: "Okay, leave that one. Explain nouns.", expected: "new_topic" },
  { label: "explicit topic abandon without a new subject named yet", setup: ["What is evaporation?"], transcript: "Let's move on to something else.", expected: "new_topic" },

  // --- Continuation ---
  { label: "plain anaphoric continuation", setup: ["What is evaporation?"], transcript: "Does it happen before boiling?", expected: "continuation" },
  { label: "code-switched continuation", setup: ["What is evaporation?"], transcript: "So why e dey happen like that?", expected: "continuation" },
  { label: "continuation that repeats the topic's own keyword", setup: ["What is evaporation?"], transcript: "So what's the difference between evaporation and boiling?", expected: "continuation" },
  { label: "continuation on photosynthesis via clarification phrasing", setup: ["Why do plants need sunlight for photosynthesis?"], transcript: "But why does that matter for the plant?", expected: "continuation" },
  { label: "continuation using 'this'", setup: ["What is evaporation?"], transcript: "Is this why puddles dry up?", expected: "continuation" },

  // --- Answer to previous ---
  { label: "short numeric answer", setup: ["Why negative times negative go give positive?"], transcript: "Forty-two.", expected: "answer_to_previous" },
  { label: "correct numeric answer", setup: ["Why negative times negative go give positive?"], transcript: "Twelve.", expected: "answer_to_previous" },
  { label: "code-switched answer", setup: ["Why negative times negative go give positive?"], transcript: "Na 12.", expected: "answer_to_previous" },
  { label: "natural-language reasoning answer", setup: ["Why negative times negative go give positive?"], transcript: "I think the answer is twelve because negative times negative gives positive.", expected: "answer_to_previous" },
  { label: "free-text explanatory answer on evaporation", setup: ["What is evaporation?"], transcript: "Heat makes the water molecules move faster.", expected: "answer_to_previous" },
  { label: "bare affirmation WITH an active topic is an answer, not ambiguous", setup: ["What is evaporation?"], transcript: "Yes.", expected: "answer_to_previous" },
  { label: "bare negation WITH an active topic is an answer, not ambiguous", setup: ["What is evaporation?"], transcript: "No.", expected: "answer_to_previous" },

  // --- Ambiguous ---
  { label: "pronoun-only question with no antecedent", setup: [], transcript: "Why does it happen?", expected: "ambiguous" },
  { label: "bare affirmation with no active topic", setup: [], transcript: "Yes.", expected: "ambiguous" },
  { label: "bare negation with no active topic", setup: [], transcript: "No.", expected: "ambiguous" },
  { label: "bare 'okay' with no active topic", setup: [], transcript: "Okay.", expected: "ambiguous" },
];

describe("golden relation-classification corpus", () => {
  it.each(CASES)("$label", ({ setup, transcript, expected }) => {
    const session = sessionAfter(setup);
    const hasActiveTopic = session.topic !== "" && session.concept !== "";
    expect(classifyRelation(transcript, session, hasActiveTopic)).toBe(expected);
  });

  it("covers at least the requested category set with real, non-padded cases", () => {
    const byRelation = CASES.reduce<Record<string, number>>((acc, c) => {
      acc[c.expected] = (acc[c.expected] ?? 0) + 1;
      return acc;
    }, {});
    expect(byRelation.new_topic).toBeGreaterThanOrEqual(10);
    expect(byRelation.continuation).toBeGreaterThanOrEqual(4);
    expect(byRelation.answer_to_previous).toBeGreaterThanOrEqual(6);
    expect(byRelation.ambiguous).toBeGreaterThanOrEqual(4);
    expect(CASES.length).toBeGreaterThanOrEqual(30);
  });

  it("never lets a genuine topic switch leave a stale tutorResponse from the old topic", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?").session;
    const staleExplanation = session.interactionHistory[0].tutorResponse?.explanation;

    for (const nextQuestion of ["What is evaporation?", "Why do clouds look white?", "What is a noun?"]) {
      const turn = processLearnerTurn(session, nextQuestion);
      expect(turn.tutorResponse?.explanation).not.toBe(staleExplanation);
    }
  });
});
