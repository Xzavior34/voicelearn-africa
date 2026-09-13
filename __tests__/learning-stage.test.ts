import { describe, it, expect } from "vitest";
import { deriveLearningStage, deriveJourneyStep } from "@/lib/client/learningStage";

const base = {
  phase: "idle" as const,
  recorderStatus: "idle" as const,
  historyLength: 0,
  isFollowUp: false,
};

describe("deriveLearningStage", () => {
  it("is 'curious' before any conversation has happened", () => {
    expect(deriveLearningStage(base)).toBe("curious");
  });

  it("is 'listening' whenever the recorder is actually recording, regardless of phase", () => {
    expect(deriveLearningStage({ ...base, recorderStatus: "recording", historyLength: 3 })).toBe("listening");
  });

  it("is 'understanding' while processing a brand-new question (no topic active yet)", () => {
    expect(
      deriveLearningStage({ ...base, phase: "processing_tutor", isFollowUp: false }),
    ).toBe("understanding");
    expect(
      deriveLearningStage({ ...base, phase: "processing_speech", isFollowUp: false }),
    ).toBe("understanding");
  });

  it("is 'assessing' while processing an answer to an already-active topic", () => {
    expect(
      deriveLearningStage({ ...base, phase: "processing_tutor", isFollowUp: true, historyLength: 1 }),
    ).toBe("assessing");
  });

  it("is 'teaching' right after a fresh explanation is delivered (no assessment yet)", () => {
    expect(
      deriveLearningStage({
        ...base,
        historyLength: 1,
        latestAssessmentOutcome: null,
        latestHasTutorResponse: true,
      }),
    ).toBe("teaching");
  });

  it("is 'success' when the latest turn was assessed correct", () => {
    expect(
      deriveLearningStage({
        ...base,
        historyLength: 2,
        latestAssessmentOutcome: "correct",
        latestHasTutorResponse: true,
      }),
    ).toBe("success");
  });

  it("is 'retry' when the latest turn was assessed incorrect/partial/uncertain", () => {
    for (const outcome of ["incorrect_misconception", "incorrect_other", "partially_correct", "uncertain"]) {
      expect(
        deriveLearningStage({
          ...base,
          historyLength: 2,
          latestAssessmentOutcome: outcome,
          latestHasTutorResponse: true,
        }),
      ).toBe("retry");
    }
  });

  it("returns to 'curious' when the latest turn matched nothing in the curriculum", () => {
    expect(
      deriveLearningStage({
        ...base,
        historyLength: 1,
        latestAssessmentOutcome: null,
        latestHasTutorResponse: false,
      }),
    ).toBe("curious");
  });

  it("is 'error' on tutor failure or microphone error/permission-denied, taking priority over everything else", () => {
    expect(deriveLearningStage({ ...base, phase: "tutor_failed", historyLength: 4 })).toBe("error");
    expect(deriveLearningStage({ ...base, recorderStatus: "error", historyLength: 4 })).toBe("error");
    expect(deriveLearningStage({ ...base, recorderStatus: "permission_denied" })).toBe("error");
    // Even if it would otherwise be "listening" or "assessing":
    expect(
      deriveLearningStage({ ...base, phase: "tutor_failed", recorderStatus: "recording" }),
    ).toBe("error");
  });
});

describe("deriveJourneyStep", () => {
  it("maps curious/listening/understanding to 'understand'", () => {
    expect(deriveJourneyStep("curious", false)).toBe("understand");
    expect(deriveJourneyStep("listening", false)).toBe("understand");
    expect(deriveJourneyStep("understanding", false)).toBe("understand");
  });

  it("maps teaching/retry to 'try'", () => {
    expect(deriveJourneyStep("teaching", true)).toBe("try");
    expect(deriveJourneyStep("retry", true)).toBe("try");
  });

  it("maps assessing to 'check'", () => {
    expect(deriveJourneyStep("assessing", true)).toBe("check");
  });

  it("maps success to 'master'", () => {
    expect(deriveJourneyStep("success", true)).toBe("master");
  });

  it("keeps 'error' from advancing or regressing the journey, based on whether a topic was active", () => {
    expect(deriveJourneyStep("error", false)).toBe("understand");
    expect(deriveJourneyStep("error", true)).toBe("try");
  });
});
