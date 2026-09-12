"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSpeechRecorder } from "@/lib/client/useSpeechRecorder";
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

export default function VoiceTutor() {
  const recorder = useSpeechRecorder();
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<LearningSession>(createInitialSession());
  const [history, setHistory] = useState<TurnLog[]>([]);
  const [manualText, setManualText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [speechErrorNote, setSpeechErrorNote] = useState<string | null>(null);
  const [systemNote, setSystemNote] = useState<string | null>(null);

  const turnContainerRef = useRef<HTMLDivElement>(null);
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
      setPhase("processing_tutor");
      setSystemNote(null);
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, session }),
        });
        if (!res.ok) {
          setPhase("tutor_failed");
          setSystemNote("The tutoring engine encountered a temporary issue. Please try speaking again.");
          return;
        }
        const data = await res.json();
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
      } catch {
        setPhase("tutor_failed");
        setSystemNote("Network trouble reaching the tutoring service. Please check your connection and try again.");
      }
    },
    [session],
  );

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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
      {/* Quiet status line, not a dashboard header */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          {session.topic ? (
            <span>
              <strong className="text-ink font-medium">{session.topic}</strong>
              <span className="mx-1.5">&middot;</span>
              Level {session.difficulty} of 5
            </span>
          ) : (
            "Ask anything you're learning about"
          )}
        </span>
        {history.length > 0 && (
          <button
            type="button"
            onClick={resetSession}
            className="text-ink-muted hover:text-rust font-medium"
          >
            Start over
          </button>
        )}
      </div>

      {/* Voice console */}
      <div className="flex flex-col items-center justify-center gap-5 text-center py-6">
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <>
              <span className="absolute h-24 w-24 rounded-full bg-ochre/15 listen-ring-1" aria-hidden="true" />
              <span className="absolute h-28 w-28 rounded-full bg-ochre/10 listen-ring-2" aria-hidden="true" />
            </>
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
            className={`relative z-10 h-20 w-20 sm:h-24 sm:w-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
              isRecording
                ? "bg-ochre text-paper scale-105"
                : isBusy
                  ? "bg-indigo-soft text-paper opacity-80 cursor-wait"
                  : "bg-indigo hover:bg-indigo-soft text-paper"
            }`}
          >
            {isBusy ? (
              <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isRecording ? (
              <span className="h-5 w-5 rounded-sm bg-paper" />
            ) : (
              <MicIcon />
            )}
          </button>
        </div>

        {/* Live status: waveform + elapsed time while listening */}
        {isRecording && (
          <div className="flex items-center gap-2.5" aria-hidden="true">
            <div className="flex items-end gap-1 h-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${i * 0.12}s` }}
                  className="w-1 h-full rounded-full bg-ochre wave-bar"
                />
              ))}
            </div>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              0:{String(recorder.durationSeconds).padStart(2, "0")}
            </span>
          </div>
        )}

        <div className="space-y-1 max-w-sm" aria-live="polite">
          <p className="text-sm sm:text-base font-medium text-ink">
            {phase === "processing_speech"
              ? "Listening back to what you said…"
              : phase === "processing_tutor"
                ? "Thinking it through…"
                : isRecording
                  ? "Listening — tap to finish"
                  : isFollowUp
                    ? "Tap to speak your answer"
                    : "Ask anything you're learning about"}
          </p>
          <p className="text-xs text-ink-muted">
            {isRecording
              ? "Speak naturally. You can mix languages."
              : isFollowUp
                ? "Your answer will be checked for understanding."
                : "Try mathematics, science, or an English comprehension question."}
          </p>
        </div>

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
            className="text-xs text-ink-muted hover:text-indigo font-medium underline underline-offset-4"
          >
            Or type instead
          </button>
        </div>
      )}

      {systemNote && (
        <p role="alert" className="text-xs text-rust text-center">{systemNote}</p>
      )}

      {/* Empty state: curated starters */}
      {history.length === 0 && phase === "idle" && (
        <div className="flex flex-col gap-3 pt-2 section-divide border-t border-line">
          <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold pt-4">
            Or try one of these
          </p>
          <div className="flex flex-col divide-y divide-line/70">
            {CURATED_PROMPTS.map((item) => (
              <button
                key={item.topic}
                type="button"
                onClick={() => submitTranscript(item.prompt)}
                className="text-left py-3 flex items-center justify-between gap-4 group"
              >
                <div>
                  <p className="text-sm text-ink group-hover:text-indigo transition-colors italic">
                    &ldquo;{item.prompt}&rdquo;
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">{item.subject} &middot; {item.topic}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted group-hover:text-indigo shrink-0 transition-colors" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation stream */}
      <div ref={turnContainerRef} className="flex flex-col gap-8">
        {history.map((turn, index) => (
          <TurnBlock key={turn.id || index} turn={turn} isLast={index === history.length - 1} />
        ))}
      </div>

      {latestTurn && latestTurn.tutorResponse == null && (
        <p className="text-sm text-ink-soft">
          I couldn&apos;t match that to a topic in the current curriculum yet (mathematics: signed
          multiplication; science: photosynthesis; English: reading comprehension). Try one of the
          starter questions above.
        </p>
      )}

      <p className="text-[11px] text-ink-muted text-center pt-4 border-t border-line/60">
        VoiceLearn uses automated speech recognition for low-stakes revision practice, alongside a
        teacher &mdash; not in place of one.
      </p>
    </div>
  );
}

function TurnBlock({ turn, isLast }: { turn: TurnLog; isLast: boolean }) {
  const showLanguageNote = turn.languageNote && turn.languageNote !== "Standard English";

  return (
    <div className={`flex flex-col gap-4 ${isLast ? "animate-fade-in" : ""}`}>
      {/* Learner message */}
      <div className="flex justify-end">
        <div className="max-w-[85%] flex flex-col items-end gap-1">
          <p className="rounded-2xl rounded-tr-sm bg-indigo text-paper px-4 py-2.5 text-sm sm:text-base leading-relaxed">
            {turn.transcript}
          </p>
          {showLanguageNote && (
            <span className="text-[11px] text-ink-muted pr-1">{turn.languageNote}</span>
          )}
        </div>
      </div>

      {/* Assessment (when this turn answers a follow-up) */}
      {turn.assessment && (
        <div className="flex justify-end">
          <p
            className={`max-w-[85%] text-xs sm:text-sm leading-relaxed pr-1 ${
              turn.assessment.outcome === "correct"
                ? "text-leaf-dark"
                : turn.assessment.outcome === "partially_correct"
                  ? "text-ochre"
                  : turn.assessment.outcome === "incorrect_misconception"
                    ? "text-rust"
                    : "text-ink-soft"
            }`}
          >
            {turn.assessment.feedback}
          </p>
        </div>
      )}

      {/* Tutor explanation */}
      {turn.tutorResponse && (
        <div className="flex flex-col gap-4 max-w-[92%]">
          <div className="rounded-2xl rounded-tl-sm bg-paper-elevated px-4 py-3.5 text-sm sm:text-base text-ink leading-relaxed">
            {turn.tutorResponse.explanation}
          </div>

          <div className="pl-4 border-l-2 border-ochre-border flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-ochre">Your turn</p>
            <p className="text-sm sm:text-base text-ink font-medium leading-relaxed">
              {turn.tutorResponse.followUpQuestion}
            </p>
            <p className="text-[11px] text-ink-muted pt-0.5">Tap the microphone above to answer.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path
        d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
