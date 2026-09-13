"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSpeechRecorder } from "@/lib/client/useSpeechRecorder";
import { createTurnGuard } from "@/lib/client/turnGuard";
import { deriveLearningStage, deriveJourneyStep, LearningStage } from "@/lib/client/learningStage";
import { JourneyIndicator } from "@/components/JourneyIndicator";
import { VoiceOrb, VoiceOrbState } from "@/components/VoiceOrb";
import { LearningSession, TutorResponse, AssessmentResult, createInitialSession } from "@/lib/tutor/schema";

type Phase =
  | "idle"
  | "recording"
  | "processing_speech"
  | "speech_unavailable"
  | "processing_tutor"
  | "responded"
  | "tutor_failed";

interface TurnLog {
  id: string;
  transcript: string;
  assessment: AssessmentResult | null;
  tutorResponse: TutorResponse | null;
  languageNote: string | null;
  timestamp: string;
  difficulty: number;
}

const CURATED_PROMPTS = [
  {
    subject: "Mathematics",
    topic: "Signed multiplication",
    prompt: "Why negative times negative go give positive?",
  },
  {
    subject: "Biology",
    topic: "Photosynthesis",
    prompt: "I understand say chlorophyll dey important, but why exactly?",
  },
  {
    subject: "English Language",
    topic: "Reading comprehension",
    prompt: "How do I identify the main idea of this passage?",
  },
];

export default function VoiceTutor({ initialPrompt }: { initialPrompt?: string } = {}) {
  const recorder = useSpeechRecorder();
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<LearningSession>(createInitialSession());
  const [history, setHistory] = useState<TurnLog[]>([]);
  const [manualText, setManualText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [speechErrorNote, setSpeechErrorNote] = useState<string | null>(null);
  const [systemNote, setSystemNote] = useState<string | null>(null);

  const turnContainerRef = useRef<HTMLDivElement>(null);
  // Guards against stale async tutor responses: if a newer turn starts
  // before an older one's /api/tutor request resolves, the older
  // response is discarded on arrival instead of overwriting state (and
  // its request is aborted outright the moment the newer turn starts).
  const turnGuardRef = useRef(createTurnGuard());
  // Guards against setting state after the component has unmounted
  // (e.g. the learner navigates away mid-request).
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const isFollowUp = session.topic !== "" && session.concept !== "";
  const latestTurn = history[history.length - 1];

  useEffect(() => {
    if (history.length > 0 && turnContainerRef.current) {
      turnContainerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [history, phase]);

  const resetSession = useCallback(() => {
    recorder.reset();
    setSession(createInitialSession());
    setHistory([]);
    setPhase("idle");
    setSpeechErrorNote(null);
    setSystemNote(null);
    setManualText("");
  }, [recorder]);

  const submitTranscript = useCallback(
    async (transcript: string) => {
      // Mark this as the active turn — starting it aborts any
      // still-in-flight previous request outright; if an old response
      // arrives anyway, isActiveTurn below rejects it as a second
      // safeguard.
      const { turnId, signal } = turnGuardRef.current.startTurn();

      setPhase("processing_tutor");
      setSystemNote(null);
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, session }),
          signal,
        });

        if (!isMountedRef.current || !turnGuardRef.current.isActiveTurn(turnId)) {
          // Component unmounted, or a newer turn has already started
          // since this request was sent — never let a stale response
          // overwrite state that may no longer exist.
          return;
        }

        if (!res.ok) {
          setPhase("tutor_failed");
          setSystemNote("The tutoring engine encountered a temporary issue. Please try speaking again.");
          return;
        }
        const data = await res.json();

        if (!isMountedRef.current || !turnGuardRef.current.isActiveTurn(turnId)) {
          return;
        }

        const nextSession: LearningSession = data.session;
        setSession(nextSession);

        const newTurn: TurnLog = {
          id: `turn-${Date.now()}`,
          transcript,
          assessment: data.assessment,
          tutorResponse: data.tutorResponse,
          // Only ever a real, computed observation from the language layer —
          // never a hard-coded "code-switch detected" label.
          languageNote: nextSession.languagePattern,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          difficulty: nextSession.difficulty,
        };

        setHistory((prev) => [...prev, newTurn]);
        setPhase("responded");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Expected when a newer turn superseded this one — not a
          // real failure, and the newer turn already owns the UI state.
          return;
        }
        if (!isMountedRef.current || !turnGuardRef.current.isActiveTurn(turnId)) {
          return;
        }
        setPhase("tutor_failed");
        setSystemNote("Network trouble reaching the tutoring service. Please check your connection and try again.");
      }
    },
    [session],
  );

  // If the learner arrived from a homepage "try asking" example
  // (?prompt=...), submit it automatically exactly once — this is the
  // one real, functional path from the homepage's tappable examples
  // into the actual product, not just a decorative link.
  const hasSubmittedInitialPromptRef = useRef(false);
  useEffect(() => {
    if (!initialPrompt || hasSubmittedInitialPromptRef.current) return;
    hasSubmittedInitialPromptRef.current = true;
    submitTranscript(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const submitAudio = useCallback(
    async (blob: Blob) => {
      setPhase("processing_speech");
      setSpeechErrorNote(null);
      try {
        const form = new FormData();
        form.append("audio", blob, "utterance.webm");
        form.append("languagePair", "en-pcm");
        const res = await fetch("/api/speech", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setPhase("speech_unavailable");
          setSpeechErrorNote(
            data.code === "REQUIRES_API_ACCESS"
              ? "Speech recognition isn't configured in this environment yet. You can type your question below in the meantime."
              : "We couldn't make that out clearly. Try moving closer to your microphone, or speak again.",
          );
          setShowManualInput(true);
          return;
        }
        await submitTranscript(data.result.transcript);
      } catch {
        setPhase("speech_unavailable");
        setSpeechErrorNote("There was a network problem reaching speech recognition. You can type what you said below.");
        setShowManualInput(true);
      }
    },
    [submitTranscript],
  );

  const handleMicPress = useCallback(async () => {
    if (recorder.status === "recording") {
      setPhase("processing_speech");
      const blob = await recorder.stop();
      if (!blob) {
        setPhase("speech_unavailable");
        setSpeechErrorNote("No audio came through. Please check microphone permissions and try again.");
        setShowManualInput(true);
        return;
      }
      await submitAudio(blob);
    } else {
      setPhase("recording");
      setSpeechErrorNote(null);
      setSystemNote(null);
      await recorder.start();
    }
  }, [recorder, submitAudio]);

  const handleManualSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualText.trim()) return;
      const text = manualText.trim();
      setManualText("");
      submitTranscript(text);
    },
    [manualText, submitTranscript],
  );

  const isBusy = phase === "processing_speech" || phase === "processing_tutor";
  const isRecording = recorder.status === "recording";

  // The single source of truth for "what learning moment is this" —
  // derived from the same real phase/recorder/session state as
  // everything else (see lib/client/learningStage.ts), not a second
  // competing state machine.
  const stage: LearningStage = deriveLearningStage({
    phase,
    recorderStatus: recorder.status,
    historyLength: history.length,
    isFollowUp,
    latestAssessmentOutcome: latestTurn?.assessment?.outcome ?? null,
    latestHasTutorResponse: latestTurn ? latestTurn.tutorResponse != null : undefined,
  });

  const STAGE_TO_ORB: Record<LearningStage, VoiceOrbState> = {
    curious: "idle",
    listening: "listening",
    understanding: "processing",
    teaching: "practice",
    assessing: "assessing",
    success: "success",
    retry: "practice",
    error: "error",
  };
  const orbState = STAGE_TO_ORB[stage];

  const STAGE_HEADLINE: Partial<Record<LearningStage, string>> = {
    listening: "Listening",
    understanding: "Understanding you",
    assessing: "Checking your thinking",
    teaching: "Let's break this down",
    success: "You got it",
    retry: "Almost — let's look at it another way",
  };

  const journeyStep = deriveJourneyStep(stage, isFollowUp);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
      {/* Minimal session indicator — a quiet lesson journey, not "Step 3 of 10" */}
      <div className="flex items-center justify-between">
        {history.length > 0 ? (
          <JourneyIndicator current={journeyStep} />
        ) : (
          <span className="text-xs text-ink-muted">Learning session</span>
        )}
        {history.length > 0 && (
          <button
            type="button"
            onClick={resetSession}
            className="text-xs text-ink-muted hover:text-rust font-medium -my-2.5 -mr-2 py-2.5 px-2 min-h-[44px] inline-flex items-center"
          >
            Start over
          </button>
        )}
      </div>

      {/* The dominant learning moment — the environment IS the page, not a
          panel inside it. Everything below responds to `stage`. */}
      <div className="flex flex-col items-center justify-center gap-5 text-center py-6">
        {stage === "curious" && (
          <div className="flex flex-col items-center gap-2 -mb-1">
            <h1
              className="font-display text-ink font-semibold tracking-tight leading-[1.05]"
              style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)" }}
            >
              What are you <span className="text-indigo-soft">curious</span> about?
            </h1>
            <p className="text-sm sm:text-base text-ink-soft max-w-sm">
              Ask anything. Speak naturally — mix languages if that&apos;s how you think.
            </p>
          </div>
        )}

        {STAGE_HEADLINE[stage] && stage !== "curious" && (
          <h2 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight -mb-1" aria-hidden="true">
            {phase === "processing_speech" ? "Listening complete" : STAGE_HEADLINE[stage]}
          </h2>
        )}

        <button
          type="button"
          onClick={handleMicPress}
          disabled={isBusy}
          aria-pressed={isRecording}
          aria-label={
            isRecording
              ? "Stop recording"
              : isFollowUp
                ? "Speak your answer"
                : "Speak your question"
          }
          className="rounded-full active:scale-95 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-4"
        >
          <VoiceOrb
            state={orbState}
            audioLevel={isRecording ? recorder.audioLevel : 0}
            size="clamp(180px, 42vw, 320px)"
          />
        </button>

        {/* Live status: elapsed time while listening (the waveform itself now lives inside the orb) */}
        {isRecording && (
          <span className="text-xs font-mono text-ink-muted tabular-nums" aria-hidden="true">
            0:{String(recorder.durationSeconds).padStart(2, "0")}
          </span>
        )}

        {/* The single accessible source of truth for the current state —
            screen readers get this even where the heading above is
            aria-hidden to avoid redundant announcements. */}
        <div className="space-y-1 max-w-sm" aria-live="polite">
          <p className="text-sm sm:text-base font-medium text-ink">
            {phase === "processing_speech"
              ? "Listening complete"
              : stage === "curious"
                ? "Tap and speak"
                : (STAGE_HEADLINE[stage] ?? "Tap and speak")}
          </p>
          <p className="text-xs text-ink-muted">
            {isRecording
              ? "Speak naturally. I'm listening."
              : stage === "understanding"
                ? "Finding the clearest way to explain it."
                : stage === "assessing"
                  ? "Give me a second…"
                  : stage === "teaching" || stage === "retry"
                    ? "Your turn — tap the orb to answer."
                    : isFollowUp
                      ? "Your answer will be checked for understanding."
                      : "Try mathematics, science, or an English comprehension question."}
          </p>
        </div>

        {stage === "success" && (
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleMicPress}
              className="rounded-full bg-indigo text-paper px-5 py-2.5 text-sm font-medium hover:bg-indigo-soft transition-colors min-h-[44px]"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={resetSession}
              className="text-sm text-ink-muted hover:text-ink font-medium px-3 py-2.5 min-h-[44px] inline-flex items-center"
            >
              Ask something else
            </button>
          </div>
        )}

        {recorder.errorMessage && (
          <p role="alert" className="text-xs text-rust max-w-xs">
            {recorder.errorMessage}
          </p>
        )}
      </div>

      {/* Manual text fallback */}
      {(phase === "speech_unavailable" || showManualInput) && (
        <div className="flex flex-col gap-2.5 animate-fade-in">
          {speechErrorNote && (
            <p className="text-xs text-ink-soft">{speechErrorNote}</p>
          )}
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <label htmlFor="manual-transcript-input" className="sr-only">
              Type your question or answer
            </label>
            <input
              id="manual-transcript-input"
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type your question…"
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm bg-paper-card text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-indigo"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isBusy}
              className="rounded-xl bg-indigo text-paper px-5 py-2.5 text-sm font-medium hover:bg-indigo-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ask
            </button>
          </form>
        </div>
      )}

      {!showManualInput && phase !== "speech_unavailable" && (
        <div className="flex justify-center -mt-4">
          <button
            type="button"
            onClick={() => setShowManualInput(true)}
            className="text-xs text-ink-muted hover:text-indigo font-medium underline underline-offset-4 py-3 px-2 min-h-[44px] inline-flex items-center"
          >
            Or type instead
          </button>
        </div>
      )}

      {systemNote && (
        <p role="alert" className="text-xs text-rust text-center">{systemNote}</p>
      )}

      {/* Empty state: tappable conversation starters — pills, not cards */}
      {stage === "curious" && !showManualInput && phase !== "speech_unavailable" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-ink-muted">or try an example below</p>
          <div className="flex flex-wrap justify-center gap-2">
            {CURATED_PROMPTS.map((item) => (
              <button
                key={item.topic}
                type="button"
                onClick={() => submitTranscript(item.prompt)}
                className="rounded-full border border-line bg-paper-card/60 px-4 py-2.5 text-xs sm:text-sm text-ink-soft hover:text-ink hover:border-indigo-border hover:bg-indigo-light transition-colors"
              >
                &ldquo;{item.prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The current learning moment — dominant, not a chat bubble wall */}
      {latestTurn && (
        <div ref={turnContainerRef} aria-live="polite" aria-atomic="false">
          <CurrentMoment
            key={latestTurn.id}
            turn={latestTurn}
            topic={session.topic}
            difficulty={session.difficulty}
          />
        </div>
      )}

      {/* Lesson trail — a compact record of what happened, not a
          transcript. Deliberately terse: "You asked" / "You practiced" /
          "You learned", not repeated chat bubbles. */}
      {history.length > 1 && (
        <LessonTrail turns={history.slice(0, -1)} />
      )}

      {latestTurn && latestTurn.tutorResponse == null && (
        <p className="text-sm text-ink-soft" role="status">
          I couldn&apos;t match that to a topic in the current curriculum yet (mathematics: signed
          multiplication, division by zero; science: photosynthesis, evaporation, friction,
          dissolving; English: main idea, affect vs. effect, nouns). Try one of the starter
          questions above.
        </p>
      )}

      <p className="text-[11px] text-ink-muted text-center pt-4 border-t border-line/60">
        VoiceLearn uses automated speech recognition for low-stakes revision practice, alongside a
        teacher &mdash; not in place of one.
      </p>
    </div>
  );
}

function CurrentMoment({
  turn,
  topic,
  difficulty,
}: {
  turn: TurnLog;
  topic: string;
  difficulty: number;
}) {
  const showLanguageNote = turn.languageNote && turn.languageNote !== "Standard English";

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* You asked — a learner statement, not a chat bubble */}
      <div className="flex flex-col items-center text-center gap-1.5">
        <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">You asked</p>
        <p className="text-base sm:text-lg text-ink leading-relaxed max-w-lg">
          &ldquo;{turn.transcript}&rdquo;
        </p>
        {showLanguageNote && (
          <span className="text-[11px] text-ink-muted">{turn.languageNote} — you don&apos;t have to change how you speak to ask.</span>
        )}
      </div>

      {/* Assessment feedback (when this turn answered a pending question) */}
      {turn.assessment && (
        <div className="flex flex-col items-center text-center gap-1">
          <p
            className={`inline-flex items-center gap-1.5 text-sm sm:text-base font-medium ${
              turn.assessment.outcome === "correct" ? "animate-success-settle" : ""
            } ${
              turn.assessment.outcome === "correct"
                ? "text-leaf-dark"
                : turn.assessment.outcome === "partially_correct"
                  ? "text-ochre-warm"
                  : turn.assessment.outcome === "incorrect_misconception"
                    ? "text-rust"
                    : "text-ink-soft"
            }`}
          >
            <AssessmentIcon outcome={turn.assessment.outcome} />
            {turn.assessment.feedback}
          </p>
        </div>
      )}

      {/* Teaching moment */}
      {turn.tutorResponse && (
        <div className="flex flex-col gap-5">
          {topic && (
            <p className="text-center text-xs text-ink-muted">
              <strong className="text-ink-soft font-medium">{topic}</strong>
              <span className="mx-1.5">&middot;</span>
              Level {difficulty} of 5
            </p>
          )}

          <div className="rounded-3xl border border-line bg-paper-card/50 px-5 py-5 sm:px-7 sm:py-6 text-sm sm:text-base text-ink leading-relaxed">
            {turn.tutorResponse.explanation}
          </div>

          <div className="flex flex-col items-center text-center gap-2 pt-1">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-cyan">Your turn</p>
            <p className="text-base sm:text-lg text-ink font-medium leading-relaxed max-w-lg">
              {turn.tutorResponse.followUpQuestion}
            </p>
            <p className="text-[11px] text-ink-muted pt-1">Tap the orb above to answer.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonTrail({ turns }: { turns: TurnLog[] }) {
  return (
    <details className="group text-xs text-ink-muted">
      <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 hover:text-ink-soft transition-colors py-2 min-h-[44px]">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
        Lesson trail &middot; {turns.length} {turns.length === 1 ? "moment" : "moments"}
      </summary>
      <div className="flex flex-col gap-2 pt-3 pl-[18px] border-l border-line ml-1">
        {turns.map((turn, i) => (
          <p key={turn.id || i} className="leading-relaxed">
            {turn.assessment ? (
              <>
                <span className="text-ink-soft">You practiced —</span> {turn.transcript}
              </>
            ) : turn.tutorResponse ? (
              <>
                <span className="text-ink-soft">You asked —</span> {turn.transcript}
              </>
            ) : (
              <>
                <span className="text-ink-soft">You asked —</span> {turn.transcript}
                <span className="text-ink-light"> (not in the current curriculum)</span>
              </>
            )}
          </p>
        ))}
      </div>
    </details>
  );
}

function AssessmentIcon({ outcome }: { outcome: AssessmentResult["outcome"] }) {
  // A shape-based cue alongside color/text, so correctness is never
  // communicated by color alone (decorative — the feedback text itself
  // is the accessible source of truth for screen readers).
  const common = "shrink-0 mt-0.5" as const;
  if (outcome === "correct") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={common} aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (outcome === "partially_correct" || outcome === "uncertain") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={common} aria-hidden="true">
        <path d="M6 12h12" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={common} aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

