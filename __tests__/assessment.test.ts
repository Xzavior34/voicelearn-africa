import { describe, it, expect } from "vitest";
import { assessAnswer, normalizeAnswer } from "@/lib/tutor/assessment";
import { findConceptById } from "@/lib/tutor/curriculum";

const concept = findConceptById("signed-multiplication")!;
const step = concept.ladder[0]; // -4 x -3 = 12

describe("normalizeAnswer", () => {
  it("converts spelled-out numbers to digits", () => {
    expect(normalizeAnswer("Twelve.")).toBe("12");
  });

  it("strips filler phrases", () => {
    expect(normalizeAnswer("I think it's 12")).toBe("12");
  });
});

describe("assessAnswer", () => {
  it("marks a correct numeric answer as correct", () => {
    const result = assessAnswer(concept, step, "Twelve.");
    expect(result.outcome).toBe("correct");
  });

  it("marks an alternate correct phrasing as correct", () => {
    const result = assessAnswer(concept, step, "positive 12");
    expect(result.outcome).toBe("correct");
  });

  it("detects the 'two negatives stay negative' misconception", () => {
    const result = assessAnswer(concept, step, "negative 12");
    expect(result.outcome).toBe("incorrect_misconception");
    expect(result.detectedMisconception).toContain("stay negative");
  });

  it("marks uncertainty markers as uncertain rather than wrong", () => {
    const result = assessAnswer(concept, step, "I no sabi, maybe 5?");
    expect(result.outcome).toBe("uncertain");
  });

  it("marks an unrelated wrong answer as incorrect_other", () => {
    const result = assessAnswer(concept, step, "one hundred");
    expect(result.outcome).toBe("incorrect_other");
  });
});

describe("assessAnswer on free-text science concept", () => {
  const scienceConcept = findConceptById("photosynthesis-chlorophyll")!;
  const scienceStep = scienceConcept.ladder[0];

  it("accepts a correct free-text answer", () => {
    const result = assessAnswer(
      scienceConcept,
      scienceStep,
      "It would stop because there's no light energy being captured.",
    );
    expect(result.outcome).toBe("correct");
  });

  it("gives partial credit for an incomplete but related answer", () => {
    const result = assessAnswer(scienceConcept, scienceStep, "photosynthesis would stop");
    expect(["correct", "partially_correct"]).toContain(result.outcome);
  });
});
