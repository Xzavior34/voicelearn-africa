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

const STARTER_PROMPTS = [
  {
    subject: "Mathematics",
    prompt: "Why negative times negative dey give positive?",
  },
  {
    subject: "Science",
    prompt: "Why do plants need sunlight?",
  },
  {
    subject: "Science",
    prompt: "Wetin be evaporation?",
  },
  {
    subject: "English",
    prompt: "What's the difference between affect and effect?",
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
  // Guards against stale async tutor responses
  const turnGuardRef = useRef(createTurnGuard());
  // Guards against state updates after unmount
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
      turnContainerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    setShowManualInput(false);
  }, [recorder]);

  const submitTranscript = useCallback(
    async (transcript: string) => {
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
          return;
        }

        if (!res.ok) {
          setPhase("tutor_failed");
          setSystemNote("We're having trouble connecting to the tutoring engine. Please try speaking again.");
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
          languageNote: nextSession.languagePattern,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          difficulty: nextSession.difficulty,
        };

        setHistory((prev) => [...prev, newTurn]);
        setPhase("responded");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!isMountedRef.current || !turnGuardRef.current.isActiveTurn(turnId)) {
          return;
        }
        setPhase("tutor_failed");
        setSystemNote("Network trouble reaching VoiceLearn. Please check your connection and try again.");
      }
    },
    [session],
  );

  // Automatically submit initialPrompt once when arriving from external link or homepage
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
              ? "Speech recognition is running in text mode. You can type your question or answer below."
              : "I couldn't catch that clearly. Try moving closer to your microphone, or speak once more.",
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
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8 min-h-[calc(100vh-140px)] justify-between">
      {/* 1. Header & Session Indicator */}
      <div className="flex items-center justify-between border-b border-line/40 pb-4">
        {history.length > 0 ? (
          <JourneyIndicator current={journeyStep} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-leaf animate-pulse" aria-hidden="true" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">Voice Learning Session</span>
          </div>
        )}
        {history.length > 0 && (
          <button
            type="button"
            onClick={resetSession}
            className="text-xs text-ink-muted hover:text-rust font-medium -my-2.5 -mr-2 py-2.5 px-2 min-h-[44px] inline-flex items-center transition-colors"
          >
            Start over
          </button>
        )}
      </div>

      {/* 2. Main Interactive Learning Scene */}
      <div className="flex flex-col items-center justify-center gap-6 text-center py-4 flex-1">
        {/* Empty State: Invitation to Speak */}
        {stage === "curious" && (
          <div className="flex flex-col items-center gap-2.5 max-w-md animate-fade-in">
            <h1
              className="font-display text-ink font-semibold tracking-tight leading-[1.08]"
              style={{ fontSize: "clamp(2rem, 5.5vw, 3.25rem)" }}
            >
              What are you <span className="text-indigo-soft">curious</span> about?
            </h1>
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
              Ask anything. Speak naturally. Mix languages if that&apos;s how you think.
            </p>
          </div>
        )}

        {/* Dynamic Learning State Headline */}
        {STAGE_HEADLINE[stage] && stage !== "curious" && (
          <div className="flex flex-col items-center gap-1 animate-fade-in" aria-hidden="true">
            <h2 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight">
              {phase === "processing_speech" ? "Listening complete" : STAGE_HEADLINE[stage]}
            </h2>
          </div>
        )}

        {/* Central VoiceOrb */}
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
                : "Tap and speak your question"
          }
          className="rounded-full active:scale-95 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-4 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <VoiceOrb
            state={orbState}
            audioLevel={isRecording ? recorder.audioLevel : 0}
            size="clamp(180px, 45vw, 300px)"
          />
        </button>

        {/* Recording Timer */}
        {isRecording && (
          <span className="text-xs font-mono text-ink-muted tabular-nums -mt-2" aria-hidden="true">
            0:{String(recorder.durationSeconds).padStart(2, "0")}
          </span>
        )}

        {/* Accessible Live Region for State Communication */}
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
                ? "Finding the best way to explain this…"
                : stage === "assessing"
                  ? "Checking your thinking…"
                  : stage === "teaching" || stage === "retry"
                    ? "Your turn — tap the orb to speak your answer."
                    : isFollowUp
                      ? "Your answer will be evaluated for understanding."
                      : "or try an example below"}
          </p>
        </div>

        {/* Correct Assessment Action Options */}
        {stage === "success" && (
          <div className="flex items-center gap-3 pt-2 animate-fade-in">
            <button
              type="button"
              onClick={handleMicPress}
              className="rounded-full bg-indigo text-paper px-6 py-3 text-sm font-medium hover:bg-indigo-soft transition-colors min-h-[44px] shadow-sm"
            >
              Continue Practice
            </button>
            <button
              type="button"
              onClick={resetSession}
              className="text-sm text-ink-muted hover:text-ink font-medium px-4 py-3 min-h-[44px] inline-flex items-center rounded-full hover:bg-paper-card transition-colors"
            >
              Explore something else
            </button>
          </div>
        )}

        {recorder.errorMessage && (
          <p role="alert" className="text-xs text-rust max-w-xs">
            {recorder.errorMessage}
          </p>
        )}
      </div>

      {/* 3. Empty State Starter Pills */}
      {stage === "curious" && !showManualInput && phase !== "speech_unavailable" && (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {STARTER_PROMPTS.map((item) => (
              <button
                key={item.prompt}
                type="button"
                onClick={() => submitTranscript(item.prompt)}
                className="rounded-full border border-line bg-paper-card/70 px-4 py-2.5 text-xs sm:text-sm text-ink-soft hover:text-ink hover:border-indigo-border hover:bg-indigo-light/60 transition-all text-left shadow-2xs active:scale-[0.98] min-h-[44px]"
              >
                &ldquo;{item.prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. The Dominant Teaching & Practice Moment */}
      {latestTurn && (
        <div ref={turnContainerRef} aria-live="polite" aria-atomic="false" className="w-full">
          <CurrentMoment
            key={latestTurn.id}
            turn={latestTurn}
            topic={session.topic}
            difficulty={session.difficulty}
          />
        </div>
      )}

      {/* 5. Manual Text Fallback */}
      {(phase === "speech_unavailable" || showManualInput) && (
        <div className="flex flex-col gap-2.5 animate-fade-in max-w-md mx-auto w-full">
          {speechErrorNote && (
            <p className="text-xs text-ink-soft text-center">{speechErrorNote}</p>
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
              placeholder={isFollowUp ? "Type your answer…" : "Type your question…"}
              className="flex-1 rounded-xl border border-line px-4 py-3 text-sm bg-paper-card text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-indigo min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isBusy}
              className="rounded-xl bg-indigo text-paper px-6 py-3 text-sm font-medium hover:bg-indigo-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isFollowUp ? "Submit" : "Ask"}
            </button>
          </form>
        </div>
      )}

      {!showManualInput && phase !== "speech_unavailable" && (
        <div className="flex justify-center -mt-2">
          <button
            type="button"
            onClick={() => setShowManualInput(true)}
            className="text-xs text-ink-muted hover:text-indigo font-medium underline underline-offset-4 py-2 px-3 min-h-[44px] inline-flex items-center"
          >
            Or type instead
          </button>
        </div>
      )}

      {systemNote && (
        <p role="alert" className="text-xs text-rust text-center">{systemNote}</p>
      )}

      {/* 6. Lesson Trail (History) */}
      {history.length > 1 && (
        <LessonTrail turns={history.slice(0, -1)} />
      )}

      {latestTurn && latestTurn.tutorResponse == null && (
        <p className="text-sm text-ink-soft text-center" role="status">
          I couldn&apos;t match that to a topic in the current curriculum yet (mathematics: signed
          multiplication, division by zero; science: photosynthesis, evaporation, friction,
          dissolving; English: main idea, affect vs. effect, nouns). Try one of the starter
          questions above.
        </p>
      )}

      {/* 7. Footer Disclosure */}
      <footer className="text-[11px] text-ink-muted text-center pt-4 border-t border-line/50">
        VoiceLearn uses automated speech recognition for low-stakes revision practice, alongside a
        teacher &mdash; not in place of one.
      </footer>
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
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      {/* 1. Learner Statement */}
      <div className="flex flex-col items-center text-center gap-1.5">
        <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">You asked</p>
        <blockquote className="text-lg sm:text-xl text-ink font-serif italic max-w-lg leading-snug">
          &ldquo;{turn.transcript}&rdquo;
        </blockquote>
        {showLanguageNote && (
          <span className="text-[11px] text-ink-muted font-mono bg-paper-card px-2.5 py-1 rounded-full border border-line mt-0.5">
            {turn.languageNote} &middot; Natural speech supported
          </span>
        )}
      </div>

      {/* 2. Assessment Feedback (if answering a previous challenge) */}
      {turn.assessment && (
        <div className="flex flex-col items-center text-center gap-1">
          <p
            className={`inline-flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2 rounded-xl border ${
              turn.assessment.outcome === "correct"
                ? "bg-leaf-light/50 border-leaf-border text-leaf-dark animate-success-settle"
                : turn.assessment.outcome === "partially_correct"
                  ? "bg-ochre-light/40 border-ochre-border text-ochre-warm"
                  : turn.assessment.outcome === "incorrect_misconception"
                    ? "bg-rust-light/40 border-rust-border text-rust"
                    : "bg-paper-card border-line text-ink-soft"
            }`}
          >
            <AssessmentIcon outcome={turn.assessment.outcome} />
            <span>{turn.assessment.feedback}</span>
          </p>
        </div>
      )}

      {/* 3. Teaching Moment */}
      {turn.tutorResponse && (
        <div className="flex flex-col gap-5 w-full">
          {topic && (
            <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
              <span className="font-semibold text-ink">{topic}</span>
              <span>&middot;</span>
              <span>Level {difficulty} of 5</span>
            </div>
          )}

          {/* Structured Pedagogical Explanation */}
          <div className="rounded-3xl border border-line bg-paper-card/70 p-6 sm:p-7 text-sm sm:text-base text-ink leading-relaxed shadow-2xs text-left">
            <p className="text-xs uppercase tracking-widest text-indigo font-bold mb-2">Concept Breakdown</p>
            <div className="space-y-3">
              {turn.tutorResponse.explanation.split(". ").reduce<string[]>((acc, sentence, idx, arr) => {
                // Group sentences into readable paragraphs
                if (idx % 2 === 0) {
                  acc.push(sentence + (idx < arr.length - 1 ? ". " : ""));
                } else {
                  acc[acc.length - 1] += sentence + (idx < arr.length - 1 ? ". " : "");
                }
                return acc;
              }, []).map((paragraph, i) => (
                <p key={i} className="text-ink-soft leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* 4. Practice Challenge ("Your turn") */}
          <div className="flex flex-col items-center text-center gap-2.5 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-light text-cyan text-xs font-bold uppercase tracking-wider">
              <span>Your turn</span>
            </div>
            <p className="text-base sm:text-lg text-ink font-medium leading-relaxed max-w-lg">
              {turn.tutorResponse.followUpQuestion}
            </p>
            <p className="text-xs text-ink-muted">Tap the orb above to speak your answer.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonTrail({ turns }: { turns: TurnLog[] }) {
  return (
    <details className="group text-xs text-ink-muted border-t border-line/60 pt-4">
      <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 hover:text-ink-soft transition-colors py-2 min-h-[44px]">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
        <span>Lesson trail &middot; {turns.length} {turns.length === 1 ? "moment" : "moments"}</span>
      </summary>
      <div className="flex flex-col gap-2.5 pt-3 pl-4 border-l-2 border-line ml-1 text-left">
        {turns.map((turn, i) => (
          <div key={turn.id || i} className="leading-relaxed space-y-0.5">
            {turn.assessment ? (
              <p>
                <span className="font-semibold text-ink">You practiced &mdash;</span> &ldquo;{turn.transcript}&rdquo;
              </p>
            ) : turn.tutorResponse ? (
              <p>
                <span className="font-semibold text-ink">You asked &mdash;</span> &ldquo;{turn.transcript}&rdquo;
                <span className="text-ink-muted"> &middot; {turn.tutorResponse.topic}</span>
              </p>
            ) : (
              <p>
                <span className="font-semibold text-ink">You asked &mdash;</span> &ldquo;{turn.transcript}&rdquo;
                <span className="text-ink-muted"> (out of curriculum)</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

function AssessmentIcon({ outcome }: { outcome: AssessmentResult["outcome"] }) {
  const common = "shrink-0" as const;
  if (outcome === "correct") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={common} aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (outcome === "partially_correct" || outcome === "uncertain") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={common} aria-hidden="true">
        <path d="M6 12h12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={common} aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
