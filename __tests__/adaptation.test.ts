import { describe, it, expect } from "vitest";
import { adaptSession } from "@/lib/tutor/adaptation";
import { createInitialSession } from "@/lib/tutor/schema";
import { AssessmentResult } from "@/lib/tutor/schema";

describe("adaptSession", () => {
  it("increases difficulty after a correct answer", () => {
    const session = createInitialSession();
    const assessment: AssessmentResult = { outcome: "correct", feedback: "Correct." };
    const next = adaptSession(session, assessment);
    expect(next.difficulty).toBe(2);
    expect(next.correctAttempts).toBe(1);
    expect(next.attempts).toBe(1);
  });

  it("decreases difficulty after an incorrect answer, not below 1", () => {
    const session = { ...createInitialSession(), difficulty: 1 };
    const assessment: AssessmentResult = { outcome: "incorrect_other", feedback: "Not quite." };
    const next = adaptSession(session, assessment);
    expect(next.difficulty).toBe(1); // clamped, was already at floor
  });

  it("does not exceed max difficulty of 5", () => {
    const session = { ...createInitialSession(), difficulty: 5 };
    const assessment: AssessmentResult = { outcome: "correct", feedback: "Correct." };
    const next = adaptSession(session, assessment);
    expect(next.difficulty).toBe(5);
  });

  it("records a detected misconception without duplicating it", () => {
    let session = createInitialSession();
    const assessment: AssessmentResult = {
      outcome: "incorrect_misconception",
      detectedMisconception: "believes two negatives stay negative",
      feedback: "Not quite.",
    };
    session = adaptSession(session, assessment);
    session = adaptSession(session, assessment);
    expect(session.misconceptions).toEqual(["believes two negatives stay negative"]);
  });

  it("holds difficulty steady on an uncertain response", () => {
    const session = { ...createInitialSession(), difficulty: 3 };
    const assessment: AssessmentResult = { outcome: "uncertain", feedback: "That's okay." };
    const next = adaptSession(session, assessment);
    expect(next.difficulty).toBe(3);
  });
});
