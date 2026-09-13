import { describe, it, expect } from "vitest";
import { processLearnerTurn } from "@/lib/tutor/session";
import { createInitialSession } from "@/lib/tutor/schema";

/**
 * Regression coverage for the stale-topic/stale-follow-up bug reported
 * during manual testing:
 *
 *   "Why do plants need sunlight for photosynthesis?" -> chlorophyll
 *   explanation + follow-up (correct)
 *
 *   "What is evaporation?" -> WRONG: returned the same chlorophyll
 *   explanation and the same chlorophyll follow-up again, because the
 *   session treated the second transcript as an answer attempt to the
 *   first question instead of recognizing it as a new, unrelated
 *   question.
 *
 * These tests assert the corrected turn-boundary behavior in
 * lib/tutor/session.ts: a new question must never be answered with a
 * stale response left over from the previous topic.
 */
describe("topic switching / state isolation", () => {
  it("reproduces the exact reported bug scenario and confirms it no longer occurs", () => {
    let session = createInitialSession();

    const turn1 = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?");
    expect(turn1.tutorResponse?.topic).toBe("Photosynthesis and chlorophyll");
    const staleExplanation = turn1.tutorResponse?.explanation;
    const staleFollowUp = turn1.tutorResponse?.followUpQuestion;
    session = turn1.session;

    const turn2 = processLearnerTurn(session, "What is evaporation?");
    expect(turn2.tutorResponse?.topic).toBe("Evaporation");
    expect(turn2.tutorResponse?.explanation).not.toBe(staleExplanation);
    expect(turn2.tutorResponse?.followUpQuestion).not.toBe(staleFollowUp);
    expect(turn2.session.topic).toBe("Evaporation");
  });

  it("does not let a mid-multiplication-ladder answer be contaminated by a photosynthesis topic switch", () => {
    // negative multiplication -> photosynthesis -> evaporation, exactly as
    // named in the bug report ("previously, an unrelated new question
    // also caused the system to return an old negative-multiplication
    // explanation").
    let session = createInitialSession();

    const turn1 = processLearnerTurn(session, "Why negative times negative go give positive?");
    expect(turn1.tutorResponse?.topic).toBe("Multiplication of signed numbers");
    session = turn1.session;

    const turn2 = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?");
    expect(turn2.tutorResponse?.topic).toBe("Photosynthesis and chlorophyll");
    expect(turn2.assessment).toBeNull(); // must not be scored as a wrong multiplication answer
    session = turn2.session;

    const turn3 = processLearnerTurn(session, "What is evaporation?");
    expect(turn3.tutorResponse?.topic).toBe("Evaporation");
    expect(turn3.assessment).toBeNull(); // must not be scored as a wrong photosynthesis answer
  });

  it("switches cleanly across four topics: photosynthesis -> evaporation -> mathematics -> english", () => {
    let session = createInitialSession();

    session = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?").session;
    expect(session.topic).toBe("Photosynthesis and chlorophyll");

    session = processLearnerTurn(session, "What is evaporation?").session;
    expect(session.topic).toBe("Evaporation");

    session = processLearnerTurn(session, "Why does dividing by zero not work?").session;
    expect(session.topic).toBe("Why division by zero is undefined");

    const turn4 = processLearnerTurn(session, "What's the difference between affect and effect?");
    expect(turn4.session.topic).toBe("Affect vs. effect");
  });

  it("resets difficulty/attempts/misconceptions when switching to a genuinely new topic", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why negative times negative go give positive?").session;
    session = processLearnerTurn(session, "Twelve.").session; // correct -> difficulty rises to 2
    expect(session.difficulty).toBe(2);

    const switched = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?");
    expect(switched.session.difficulty).toBe(1);
    expect(switched.session.attempts).toBe(0);
    expect(switched.session.misconceptions.length).toBe(0);
  });

  it("still preserves legitimate follow-up answers within the same topic (no false topic-switch)", () => {
    let session = createInitialSession();
    const turn1 = processLearnerTurn(session, "Why negative times negative go give positive?");
    session = turn1.session;

    const turn2 = processLearnerTurn(session, "Twelve.");
    expect(turn2.assessment?.outcome).toBe("correct");
    expect(turn2.tutorResponse?.topic).toBe("Multiplication of signed numbers");
  });

  it("does not silently answer an unrecognized new question with the previous topic's response", () => {
    let session = createInitialSession();
    const turn1 = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?");
    const staleExplanation = turn1.tutorResponse?.explanation;
    session = turn1.session;

    const turn2 = processLearnerTurn(session, "What is the capital of Nigeria?");
    expect(turn2.tutorResponse).toBeNull();
    expect(turn2.assessment).toBeNull();
    expect(turn2.session.topic).toBe(""); // stale topic must be cleared, not left dangling
    expect(turn2.tutorResponse?.explanation).not.toBe(staleExplanation);
  });

  it("recognizes code-switched (English + Nigerian Pidgin) evaporation questions as evaporation, not a stale topic", () => {
    let session = createInitialSession();
    session = processLearnerTurn(session, "Why do plants need sunlight for photosynthesis?").session;

    const turn2 = processLearnerTurn(
      session,
      "Why water fit evaporate even when e never reach 100 degrees?",
    );
    expect(turn2.tutorResponse?.topic).toBe("Evaporation");
  });
});
