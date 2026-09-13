import { describe, it, expect } from "vitest";
import { processLearnerTurn, classifyRelation } from "@/lib/tutor/session";
import { createInitialSession } from "@/lib/tutor/schema";

/**
 * Golden regression set for the hardening pass: new-topic detection must
 * work even for questions the curriculum has NEVER heard of (no keyword
 * match at all), not just for questions that happen to match a different
 * curriculum concept. These are the exact fixtures from the hardening
 * request.
 */
describe("conversation relation classification", () => {
  it("NEW UNKNOWN TOPIC: a question with no curriculum match at all is still a new topic, not an assessment", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?").session;
    expect(session.topic).toBe("Photosynthesis and chlorophyll");

    const turn = processLearnerTurn(session, "Why do clouds look white?");
    expect(turn.conversationRelation).toBe("new_topic");
    expect(turn.assessment).toBeNull(); // must NOT be scored as a wrong photosynthesis answer
    expect(turn.tutorResponse).toBeNull(); // curriculum genuinely has no "clouds" concept
    expect(turn.session.topic).toBe(""); // stale photosynthesis topic must be cleared, not left dangling
  });

  it("NEW UNKNOWN TOPIC: other out-of-curriculum questions are also classified as new topics, never as answers", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?").session;

    for (const question of [
      "How does a rainbow form?",
      "Why does metal feel colder than wood?",
      "What causes thunder?",
    ]) {
      const turn = processLearnerTurn(session, question);
      expect(turn.conversationRelation).toBe("new_topic");
      expect(turn.assessment).toBeNull();
    }
  });

  it("NEW KNOWN TOPIC: a question matching a different curriculum concept is a new topic", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?").session;

    const turn = processLearnerTurn(session, "What is evaporation?");
    expect(turn.conversationRelation).toBe("new_topic");
    expect(turn.tutorResponse?.topic).toBe("Evaporation");
  });

  it("CONTINUATION: an anaphoric follow-up on the active topic stays on that topic", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "What is evaporation?").session;
    expect(session.topic).toBe("Evaporation");

    const turn = processLearnerTurn(session, "Does it happen before boiling?");
    expect(turn.conversationRelation).toBe("continuation");
    expect(turn.session.topic).toBe("Evaporation"); // topic preserved, not reset
  });

  it("CONTINUATION: an anaphoric follow-up that happens to repeat the topic's own keyword is still a continuation, not a restart", () => {
    // Regression for the exact demo-script step: after landing on
    // evaporation, "So what's the difference between evaporation and
    // boiling?" re-mentions "evaporation" (the same concept's own
    // trigger word) but is clearly a continuation, not a fresh restart.
    let session = createInitialSession();
    session = processLearnerTurn(session, "What is evaporation?").session;
    const attempts = session.attempts;

    const turn = processLearnerTurn(session, "So what's the difference between evaporation and boiling?");
    expect(turn.conversationRelation).toBe("continuation");
    expect(turn.session.topic).toBe("Evaporation");
    expect(turn.session.attempts).toBeGreaterThanOrEqual(attempts); // progress not reset to 0
  });

  it("ANSWER: a plain (non-question) reply to a pending ladder question is an answer, not a new topic", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why negative times negative go give positive?").session;

    const turn = processLearnerTurn(session, "Forty-two.");
    expect(turn.conversationRelation).toBe("answer_to_previous");
    expect(turn.assessment).not.toBeNull();
  });

  it("ANSWER: a free-text explanatory answer is still assessed, not treated as a new topic", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "What is evaporation?").session;

    const turn = processLearnerTurn(session, "Heat makes the water molecules move faster.");
    expect(turn.conversationRelation).toBe("answer_to_previous");
    expect(turn.assessment).not.toBeNull();
    expect(turn.session.topic).toBe("Evaporation"); // stayed on topic, was assessed against it
  });

  it("AMBIGUOUS: a pronoun-only question with no prior topic to anchor it asks for clarification", () => {
    const session = createInitialSession();
    const turn = processLearnerTurn(session, "Why does it happen?");
    expect(turn.conversationRelation).toBe("ambiguous");
    expect(turn.tutorResponse).toBeNull();
    expect(turn.assessment).toBeNull();
  });

  it("classifyRelation is directly testable and curriculum-independent for new-topic detection", () => {
    const session = createInitialSession();
    // No active topic at all, and the transcript matches nothing in the
    // curriculum — must still resolve as new_topic, not fall through to
    // some default "answer" classification.
    expect(classifyRelation("Why does metal feel colder than wood?", session, false)).toBe("new_topic");
  });
});

describe("additional regression: topic abandonment to a genuinely unmatched subject", () => {
  it("'Forget that. Explain friction.' is a new topic, not a stale answer, even though 'friction' alone isn't a curriculum trigger", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why negative times negative go give positive?").session;

    const turn = processLearnerTurn(session, "Forget that. Explain friction.");
    expect(turn.conversationRelation).toBe("new_topic");
    expect(turn.assessment).toBeNull(); // must not be scored as a wrong multiplication answer
    expect(turn.session.topic).toBe(""); // "friction" alone isn't a trigger for friction-rolling (needs "ball"), so this is honestly unrecognized — but must not fall back to the old topic
  });
});
