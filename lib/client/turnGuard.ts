/**
 * Minimal turn/request identity guard against stale async responses.
 *
 * The tutor UI can, in principle, have two `/api/tutor` requests in
 * flight at once (e.g. a learner taps a second starter prompt before
 * the first request has resolved, or submits the same answer twice in
 * quick succession). If an OLDER request resolves AFTER a NEWER one has
 * already started, it must never be allowed to overwrite the newer
 * turn's state — that would silently revert the conversation to a
 * stale response, and if it resolves as an ERROR it must not surface an
 * error for a turn the learner has already moved past.
 *
 * This guard is deliberately tiny: it hands out a monotonically
 * increasing turn id (bundled with an `AbortSignal` for the matching
 * in-flight request) and lets the caller check, at the moment a
 * response comes back, whether that id is still the active one. It does
 * not know anything about tutor/session semantics — it is pure
 * bookkeeping, safe to unit test in isolation, and cheap to wire into a
 * component with a single `useRef`.
 */
export interface TurnHandle {
  /** Unique id for this turn. Check `isActiveTurn(turnId)` before
   * committing this turn's response to UI state. */
  turnId: string;
  /** Aborts automatically the moment a NEWER turn starts — pass this to
   * `fetch(..., { signal })` so a superseded request is cancelled
   * outright rather than merely ignored on arrival. */
  signal: AbortSignal;
}

export interface TurnGuard {
  /** Call when a new turn starts (a fetch is about to be sent). Aborts
   * the previous turn's in-flight request (if any) and returns a handle
   * for the new, now-active turn. */
  startTurn(): TurnHandle;
  /** Call when a turn's response comes back, before committing it to
   * state. Only the most recently started turn is ever active. */
  isActiveTurn(turnId: string): boolean;
  /** The id of the most recently started turn, or null if none yet. */
  currentTurnId(): string | null;
}

export function createTurnGuard(): TurnGuard {
  let counter = 0;
  let activeTurnId: string | null = null;
  let activeController: AbortController | null = null;

  return {
    startTurn() {
      // A new turn immediately supersedes whatever was in flight —
      // cancel its request outright rather than merely ignoring it
      // later, so it doesn't waste a round trip.
      activeController?.abort();

      counter += 1;
      activeTurnId = `turn-${counter}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      activeController = new AbortController();

      return { turnId: activeTurnId, signal: activeController.signal };
    },
    isActiveTurn(turnId: string) {
      return activeTurnId !== null && turnId === activeTurnId;
    },
    currentTurnId() {
      return activeTurnId;
    },
  };
}
