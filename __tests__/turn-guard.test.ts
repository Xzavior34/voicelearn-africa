import { describe, it, expect } from "vitest";
import { createTurnGuard } from "@/lib/client/turnGuard";

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

describe("turnGuard", () => {
  /**
   * 1. Reproduces exactly the race condition named in the hardening
   * request: A starts, B starts, B resolves first, A resolves later.
   * Expected: B remains the active response, A's late arrival is
   * rejected.
   */
  it("keeps the later-started turn active even when the earlier turn resolves after it", async () => {
    const guard = createTurnGuard();

    const turnA = guard.startTurn();
    const slowResponseA = delay(50, turnA.turnId);

    const turnB = guard.startTurn();
    const fastResponseB = delay(5, turnB.turnId);

    const bTurnId = await fastResponseB;
    expect(guard.isActiveTurn(bTurnId)).toBe(true);

    const aTurnId = await slowResponseA;
    expect(guard.isActiveTurn(aTurnId)).toBe(false);
  });

  it("treats a single, non-overlapping turn as active for its own response", () => {
    const guard = createTurnGuard();
    const turn = guard.startTurn();
    expect(guard.isActiveTurn(turn.turnId)).toBe(true);
  });

  it("supersedes an in-flight turn as soon as a new one starts, before either resolves", () => {
    const guard = createTurnGuard();
    const turnA = guard.startTurn();
    expect(guard.isActiveTurn(turnA.turnId)).toBe(true);

    const turnB = guard.startTurn();
    expect(guard.isActiveTurn(turnA.turnId)).toBe(false);
    expect(guard.isActiveTurn(turnB.turnId)).toBe(true);
  });

  it("rejects an unknown/empty turn id", () => {
    const guard = createTurnGuard();
    guard.startTurn();
    expect(guard.isActiveTurn("not-a-real-turn-id")).toBe(false);
  });

  /**
   * 2. Starting a new turn aborts the previous turn's in-flight
   * request outright (not just ignoring it later) — this is the actual
   * AbortController wiring, not just id bookkeeping.
   */
  it("aborts the previous turn's signal the moment a new turn starts", () => {
    const guard = createTurnGuard();
    const turnA = guard.startTurn();
    expect(turnA.signal.aborted).toBe(false);

    guard.startTurn();
    expect(turnA.signal.aborted).toBe(true);
  });

  /**
   * 3. Duplicate submission: the same transcript submitted twice in
   * quick succession (e.g. a double-tap) behaves exactly like the A/B
   * race — the first submission's request is aborted and its response,
   * if it arrives anyway, is rejected.
   */
  it("handles duplicate (double-tap) submissions as a plain A/B race", async () => {
    const guard = createTurnGuard();
    const first = guard.startTurn();
    const second = guard.startTurn();

    expect(first.signal.aborted).toBe(true);
    expect(guard.isActiveTurn(first.turnId)).toBe(false);
    expect(guard.isActiveTurn(second.turnId)).toBe(true);
  });

  /**
   * 4. Rapid microphone submissions: three or more overlapping turns
   * (e.g. the learner mashes the mic button) — only the last one wins,
   * every earlier one is both aborted and rejected on arrival.
   */
  it("keeps only the last of several rapid overlapping turns active", () => {
    const guard = createTurnGuard();
    const turns = [guard.startTurn(), guard.startTurn(), guard.startTurn(), guard.startTurn()];
    const last = turns[turns.length - 1];

    for (const turn of turns.slice(0, -1)) {
      expect(turn.signal.aborted).toBe(true);
      expect(guard.isActiveTurn(turn.turnId)).toBe(false);
    }
    expect(guard.isActiveTurn(last.turnId)).toBe(true);
  });

  /**
   * 5. API failure after a newer turn has already started: turn A's
   * request fails (network error, 500, etc.) but only AFTER turn B has
   * already started. A's failure must not be surfaced as the current
   * error state, because the learner has already moved on to B.
   */
  it("does not let a failed older turn override a newer active turn's state", async () => {
    const guard = createTurnGuard();
    const turnA = guard.startTurn();
    const failingRequestA = delay(20, turnA.turnId).then(() => {
      throw new Error("simulated network failure for turn A");
    });

    const turnB = guard.startTurn();

    let errorSurfacedForStaleTurn = false;
    try {
      await failingRequestA;
    } catch {
      // Only surface this failure if A were still the active turn.
      if (guard.isActiveTurn(turnA.turnId)) {
        errorSurfacedForStaleTurn = true;
      }
    }

    expect(errorSurfacedForStaleTurn).toBe(false);
    expect(guard.isActiveTurn(turnB.turnId)).toBe(true);
  });

  /**
   * 6. Retry after failure: once a turn fails, starting a fresh turn
   * (the learner retries) must work normally — failure of a previous
   * turn must not leave the guard in a state that blocks future turns.
   */
  it("allows a normal new turn to become active after a previous turn failed", () => {
    const guard = createTurnGuard();
    const failedTurn = guard.startTurn();
    // ...failedTurn's request fails; the learner taps retry:
    const retryTurn = guard.startTurn();

    expect(guard.isActiveTurn(failedTurn.turnId)).toBe(false);
    expect(guard.isActiveTurn(retryTurn.turnId)).toBe(true);
  });
});
