import { describe, it, expect } from "vitest";
import { processLearnerTurn } from "@/lib/tutor/session";
import { createInitialSession } from "@/lib/tutor/schema";

/**
 * End-to-end test of the core downstream task the competition brief
 * requires: the tutor's NEXT question must depend on the learner's
 * PREVIOUS answer, across multiple turns, without any live speech
 * provider involved (this operates purely on transcripts, which is
 * exactly the boundary between lib/speech and lib/tutor).
 */
describe("full learning loop", () => {
  it("teaches, questions, assesses, and adapts across three turns", () => {
    let session = createInitialSession();

    // Turn 1: learner asks the opening conceptual question.
    const turn1 = processLearnerTurn(session, "Why negative times negative go give positive?");
    expect(turn1.tutorResponse?.topic).toBe("Multiplication of signed numbers");
    expect(turn1.tutorResponse?.followUpQuestion).toContain("-4 x -3");
    session = turn1.session;
    expect(session.difficulty).toBe(1);

    // Turn 2: learner answers correctly -> difficulty should increase
    // and the NEXT question must be different from the first.
    const turn2 = processLearnerTurn(session, "Twelve.");
    expect(turn2.assessment?.outcome).toBe("correct");
    expect(turn2.session.difficulty).toBe(2);
    expect(turn2.tutorResponse?.followUpQuestion).toContain("-6 x -2");
    session = turn2.session;

    // Turn 3: learner answers incorrectly with the classic misconception
    // -> difficulty should drop back down and the misconception should
    // be recorded.
    const turn3 = processLearnerTurn(session, "Negative twelve.");
    expect(turn3.assessment?.outcome).toBe("incorrect_misconception");
    expect(turn3.session.difficulty).toBe(1);
    expect(turn3.session.misconceptions.length).toBe(1);
  });

  it("stays on the same session state for an unrecognized topic instead of crashing", () => {
    const session = createInitialSession();
    const turn = processLearnerTurn(session, "What is the capital of Nigeria?");
    expect(turn.tutorResponse).toBeNull();
    expect(turn.session.topic).toBe("");
    expect(turn.session.interactionHistory.length).toBe(1);
  });
});
