import { describe, it, expect } from "vitest";
import { routeQuestion } from "@/lib/tutor/router";

/** Small helper: assert a transcript routes to the expected concept id. */
function expectRoute(transcript: string, topicId: string) {
  const result = routeQuestion(transcript);
  expect(result.matched, `expected "${transcript}" to match ${topicId}, but it did not match anything`).toBe(true);
  expect(result.topicId).toBe(topicId);
  expect(result.originalQuery).toBe(transcript);
  expect(typeof result.confidence).toBe("number");
  expect(result.confidence).toBeGreaterThan(0);
  expect(result.confidence).toBeLessThanOrEqual(1);
}

describe("A. Standard English", () => {
  it.each([
    ["What is photosynthesis?", "photosynthesis-chlorophyll"],
    ["Explain friction.", "friction-rolling"],
    ["What is division by zero?", "divide-by-zero"],
  ])("%s -> %s", (transcript, topicId) => {
    expectRoute(transcript, topicId);
  });
});

describe("B. Nigerian Pidgin", () => {
  it.each([
    ["Wetin be photosynthesis?", "photosynthesis-chlorophyll"],
    ["Abeg explain friction.", "friction-rolling"],
    ["How evaporation dey happen?", "evaporation"],
  ])("%s -> %s", (transcript, topicId) => {
    expectRoute(transcript, topicId);
  });
});

describe("C. Code switching", () => {
  it.each([
    ["Wetin be the main idea?", "main-idea"],
    ["Why plants need sunlight?", "photosynthesis-chlorophyll"],
    ["Abeg explain division by zero.", "divide-by-zero"],
  ])("%s -> %s", (transcript, topicId) => {
    expectRoute(transcript, topicId);
  });
});

describe("D. ASR corruption", () => {
  it.each([
    ["photos 10 cies", "photosynthesis-chlorophyll"],
    ["photo synthesis", "photosynthesis-chlorophyll"],
    ["photosintesis", "photosynthesis-chlorophyll"],
  ])("%s -> %s", (transcript, topicId) => {
    expectRoute(transcript, topicId);
  });

  it("routes a full sentence with ASR-garbled phrasing confidently, per the confidence/safety brief's own example", () => {
    const result = routeQuestion("Wetin be photos 10 cies?");
    expect(result.matched).toBe(true);
    expect(result.topicId).toBe("photosynthesis-chlorophyll");
  });
});

describe("E. Natural paraphrases", () => {
  it.each([
    ["How plants make food?", "photosynthesis-chlorophyll"],
    ["Why does evaporation happen?", "evaporation"],
    ["What happens when you divide by zero?", "divide-by-zero"],
  ])("%s -> %s", (transcript, topicId) => {
    expectRoute(transcript, topicId);
  });
});

describe("F. Unsupported questions must never be mapped to an arbitrary curriculum topic", () => {
  it.each([
    "Wetin be 2+2?",
    "What is the capital of Nigeria?",
    "Forget that. Explain quantum entanglement.",
    "Tell me a story about a lion.",
    "What time is it?",
  ])('"%s" does not match any curriculum concept', (transcript) => {
    const result = routeQuestion(transcript);
    expect(result.matched).toBe(false);
    expect(result.topicId).toBeNull();
    expect(result.confidence).toBeNull();
  });

  it("never crashes or throws on a short, unsupported arithmetic-style question", () => {
    expect(() => routeQuestion("Wetin be 2+2?")).not.toThrow();
  });

  it("does not let a generic instructional word (e.g. 'explain') coincidentally fuzzy-match an unrelated concept (regression: this exact bug was caught by this test suite during development)", () => {
    const result = routeQuestion("Forget that. Explain quantum entanglement.");
    expect(result.matched).toBe(false);
  });
});

describe("G. Regression: existing routing behavior for already-supported phrasing", () => {
  it.each([
    ["Why negative times negative go give positive?", "signed-multiplication"],
    ["I understand say chlorophyll dey important, but why exactly?", "photosynthesis-chlorophyll"],
    ["How do I identify the main idea of this passage?", "main-idea"],
  ])("%s -> %s", (transcript, topicId) => {
    expectRoute(transcript, topicId);
  });

  it("still returns unmatched for a genuinely out-of-curriculum question", () => {
    const result = routeQuestion("What is the capital of Nigeria?");
    expect(result.matched).toBe(false);
  });
});

describe("Structured routing result shape", () => {
  it("reports matchMethod and normalizedQuery honestly for a Pidgin-framed question", () => {
    const result = routeQuestion("Abeg wetin be photosynthesis?");
    expect(result.matched).toBe(true);
    expect(result.topicId).toBe("photosynthesis-chlorophyll");
    expect(result.matchMethod).not.toBeNull();
    expect(result.normalizedQuery).toBe("abeg wetin be photosynthesis");
    expect(result.originalQuery).toBe("Abeg wetin be photosynthesis?");
  });

  it("preserves the original transcript unmodified for display/analytics even when routing uses the normalized form", () => {
    const original = "WETIN BE Photosynthesis???";
    const result = routeQuestion(original);
    expect(result.originalQuery).toBe(original);
  });

  it("never reports a match without a topicId, and never reports a topicId without a match", () => {
    const matched = routeQuestion("What is photosynthesis?");
    expect(matched.matched).toBe(true);
    expect(matched.topicId).not.toBeNull();

    const unmatched = routeQuestion("What is the weather today?");
    expect(unmatched.matched).toBe(false);
    expect(unmatched.topicId).toBeNull();
  });
});
