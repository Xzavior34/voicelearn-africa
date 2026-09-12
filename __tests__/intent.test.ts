import { describe, it, expect } from "vitest";
import { extractIntent } from "@/lib/tutor/intent";

describe("extractIntent", () => {
  it("matches the signed-multiplication concept from a Pidgin-inflected question", () => {
    const { matchedConcept, understanding } = extractIntent(
      "Why negative times negative go give positive?",
    );
    expect(matchedConcept?.id).toBe("signed-multiplication");
    expect(understanding.learningNeed).toBe("conceptual_question");
    expect(understanding.languageNote).toContain("Pidgin");
  });

  it("matches the chlorophyll concept and detects clarification intent", () => {
    const { matchedConcept, understanding } = extractIntent(
      "I understand say chlorophyll dey important, but why exactly?",
    );
    expect(matchedConcept?.id).toBe("photosynthesis-chlorophyll");
    expect(understanding.learningNeed).toBe("clarification");
  });

  it("matches the main-idea concept from standard English", () => {
    const { matchedConcept, understanding } = extractIntent(
      "How do I identify the main idea of this passage?",
    );
    expect(matchedConcept?.id).toBe("main-idea");
    expect(understanding.languageNote).toBe("Standard English");
  });

  it("detects procedural questions", () => {
    const { understanding } = extractIntent("How I fit solve this simultaneous equation?");
    expect(understanding.learningNeed).toBe("procedural_question");
  });

  it("returns null matchedConcept for out-of-curriculum topics", () => {
    const { matchedConcept } = extractIntent("What is the capital of Nigeria?");
    expect(matchedConcept).toBeNull();
  });

  it("never reports a fabricated confidence score", () => {
    const { understanding } = extractIntent("Why negative times negative go give positive?");
    expect(understanding.confidence).toBeNull();
  });
});
