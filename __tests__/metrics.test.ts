import { describe, it, expect } from "vitest";
import {
  wordErrorRate,
  characterErrorRate,
  codeSwitchPreservation,
  lexicalOverlapProxy,
} from "@/lib/benchmark/metrics";

describe("wordErrorRate", () => {
  it("is 0 for an exact match", () => {
    expect(wordErrorRate("hello world", "hello world")).toBe(0);
  });

  it("is 1 for a completely wrong same-length hypothesis", () => {
    expect(wordErrorRate("hello world", "foo bar")).toBe(1);
  });

  it("computes the correct rate for one substitution out of three words", () => {
    // "why negative times" vs "why positive times" -> 1 substitution / 3 ref words
    expect(wordErrorRate("why negative times", "why positive times")).toBeCloseTo(1 / 3, 5);
  });

  it("handles empty reference safely", () => {
    expect(wordErrorRate("", "")).toBe(0);
    expect(wordErrorRate("", "extra words")).toBe(1);
  });
});

describe("characterErrorRate", () => {
  it("is 0 for identical strings", () => {
    expect(characterErrorRate("dey", "dey")).toBe(0);
  });

  it("is greater than 0 for a one-character difference", () => {
    const cer = characterErrorRate("wetin", "wetim");
    expect(cer).toBeGreaterThan(0);
    expect(cer).toBeLessThan(1);
  });
});

describe("codeSwitchPreservation", () => {
  it("returns null when the reference has no Pidgin markers", () => {
    expect(codeSwitchPreservation("why is the sky blue", "why is the sky blue")).toBeNull();
  });

  it("returns 1 when all markers are preserved", () => {
    expect(codeSwitchPreservation("why negative times negative go give positive", "why negative times negative go give positive")).toBe(1);
  });

  it("returns a fraction when a model 'corrects away' the Pidgin markers", () => {
    const score = codeSwitchPreservation(
      "why negative times negative go give positive",
      "why does negative times negative give a positive number",
    );
    expect(score).toBe(0); // "go" was dropped/normalized away in this hypothesis
  });
});

describe("lexicalOverlapProxy", () => {
  it("is 1 for identical text", () => {
    expect(lexicalOverlapProxy("hello world", "hello world")).toBe(1);
  });

  it("is between 0 and 1 for partial overlap", () => {
    const score = lexicalOverlapProxy("hello there world", "hello world friend");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});
