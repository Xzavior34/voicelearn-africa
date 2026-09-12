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
  understandingSummary: string;
  timestamp: string;
  difficulty: number;
}

const CURATED_PROMPTS = [
  {
    subject: "Mathematics",
    badgeColor: "bg-indigo-light text-indigo border-indigo-border",
    topic: "Signed Multiplication",
    prompt: "Why negative times negative go give positive?",
    label: "Conceptual Question",
  },
  {
    subject: "Biology / Science",
    badgeColor: "bg-leaf-light text-leaf border-leaf-border",
    topic: "Photosynthesis",
    prompt: "I understand say chlorophyll dey important, but why exactly?",
    label: "Clarification",
  },
  {
    subject: "English Language",
    badgeColor: "bg-ochre-light text-ochre border-ochre-border",
    topic: "Reading Comprehension",
    prompt: "How do I identify the main idea of this passage?",
    label: "Procedural Guide",
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

  // Auto-scroll on new responses
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
          understandingSummary: data.understandingSummary,
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
              ? "Live Sahara STT credentials not detected in this environment. You can use the manual text prompt below to test full reasoning and adaptation."
              : "We could not transcribe that recording clearly. Try moving closer to your microphone or speak again.",
          );
          setShowManualInput(true);
          return;
        }
        await submitTranscript(data.result.transcript);
      } catch {
        setPhase("speech_unavailable");
        setSpeechErrorNote("Network difficulty connecting to Sahara Speech STT. You can type what you said below.");
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
        setSpeechErrorNote("No audio caught. Please check microphone permissions and try speaking again.");
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
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6">
      {/* 1. Header & Live Context Ribbon */}
      <div className="rounded-2xl border border-line bg-paper-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-leaf animate-pulse" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink">
              Voice Tutor Console
            </span>
            <span className="text-xs text-ink-muted">·</span>
            <span className="text-xs text-indigo font-medium">English + Nigerian Pidgin</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <span>
              {session.topic ? (
                <strong className="text-ink">{session.topic}</strong>
              ) : (
                <span className="italic text-ink-muted">Awaiting learner question...</span>
              )}
            </span>
            {session.topic && (
              <>
                <span>·</span>
                <span>Attempts: {session.attempts}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Difficulty Ladder + Reset */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-line/60">
          <div className="flex items-center gap-1.5 bg-paper-subtle px-3 py-1.5 rounded-xl border border-line">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Ladder
            </span>
            <div className="flex items-center gap-1 ml-1" title={`Difficulty Level ${session.difficulty} of 5`}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <span
                  key={lvl}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    lvl <= session.difficulty
                      ? "bg-indigo scale-105"
                      : "bg-line"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-indigo ml-1">L{session.difficulty}</span>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={resetSession}
              className="text-xs text-ink-muted hover:text-rust font-medium px-2.5 py-1.5 rounded-lg hover:bg-paper-elevated transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Voice Console (Hero Microphone) */}
      <div className="rounded-3xl border border-line bg-gradient-to-b from-paper-card to-paper-elevated/40 p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center gap-5 text-center relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isRecording ? "opacity-100 bg-ochre-light/40" : "opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Tactile Microphone Button Container */}
        <div className="relative flex items-center justify-center my-2">
          {/* Animated Listening Pulse Rings */}
          {isRecording && (
            <>
              <span className="absolute h-32 w-32 rounded-full bg-ochre/25 listen-ring-1" aria-hidden="true" />
              <span className="absolute h-40 w-40 rounded-full bg-ochre/15 listen-ring-2" aria-hidden="true" />
            </>
          )}

          <button
            type="button"
            onClick={handleMicPress}
            disabled={isBusy}
            aria-pressed={isRecording}
            aria-label={
              isRecording
                ? "Stop recording speech"
                : isFollowUp
                  ? "Speak your answer to the tutor"
                  : "Speak your question to the tutor"
            }
            className={`relative z-10 h-24 w-24 sm:h-28 sm:w-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md active:scale-95 focus-visible:outline-indigo ${
              isRecording
                ? "bg-ochre text-paper shadow-ochre/30 shadow-lg scale-105"
                : isBusy
                  ? "bg-indigo-soft text-paper opacity-80 cursor-wait"
                  : "bg-indigo hover:bg-indigo-soft text-paper hover:shadow-indigo/25 hover:shadow-lg"
            }`}
          >
            {isBusy ? (
              <svg className="animate-spin h-8 w-8 text-paper" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isRecording ? (
              <div className="flex flex-col items-center gap-1">
                <span className="h-6 w-6 rounded-md bg-paper flex items-center justify-center">
                  <span className="h-3 w-3 rounded-xs bg-ochre" />
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase text-paper">Stop</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <MicIcon />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-paper/80">
                  {isFollowUp ? "Answer" : "Speak"}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Dynamic Status & Guidance Prompt */}
        <div className="space-y-1.5 relative z-10 max-w-md" aria-live="polite">
          <p className="text-sm sm:text-base font-semibold text-ink tracking-tight">
            {phase === "processing_speech"
              ? "Transcribing your speech via Sahara STT…"
              : phase === "processing_tutor"
                ? "Analyzing educational intent & formulating answer…"
                : isRecording
                  ? `Listening to your voice (${recorder.durationSeconds}s) — tap to finish`
                  : isFollowUp
                    ? "Tap the microphone to speak your answer"
                    : "Tap to ask a question in English or Nigerian Pidgin"}
          </p>
          <p className="text-xs text-ink-muted">
            {isRecording
              ? "Speak naturally — code-switching between English and Pidgin is fully supported."
              : isFollowUp
                ? "Your response will be checked for concept understanding and adapted."
                : "Examples: Math rules, photosynthesis, or English comprehension main ideas."}
          </p>
        </div>

        {/* Audio Visualizer Bars Simulation when recording */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 pt-1" aria-hidden="true">
            {[14, 24, 18, 28, 20, 32, 16, 26, 12].map((height, i) => (
              <span
                key={i}
                style={{ height: `${height}px` }}
                className="w-1 rounded-full bg-ochre animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Recording / Hardware Errors */}
        {recorder.errorMessage && (
          <div role="alert" className="p-3 rounded-xl bg-rust-light border border-rust-border text-xs text-rust max-w-md">
            {recorder.errorMessage}
          </div>
        )}
      </div>

      {/* 3. Speech Error / Fallback Drawer */}
      {(phase === "speech_unavailable" || showManualInput) && (
        <div className="rounded-2xl border border-line bg-paper-card p-5 shadow-xs flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                Type Question Manually
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-paper-subtle text-ink-muted border border-line">
                Fallback Mode
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowManualInput(false)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Hide
            </button>
          </div>

          {speechErrorNote && (
            <p className="text-xs text-ink-soft bg-paper-subtle p-3 rounded-xl border border-line/80 leading-relaxed">
              {speechErrorNote}
            </p>
          )}

          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <label htmlFor="manual-transcript-input" className="sr-only">
              Type your question or response
            </label>
            <input
              id="manual-transcript-input"
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="e.g. Why negative times negative go give positive?"
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm bg-paper text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-indigo shadow-xs"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isBusy}
              className="rounded-xl bg-indigo text-paper px-5 py-2.5 text-sm font-semibold hover:bg-indigo-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Manual Input Toggle Button */}
      {!showManualInput && phase !== "speech_unavailable" && (
        <div className="flex justify-center -mt-2">
          <button
            type="button"
            onClick={() => setShowManualInput(true)}
            className="text-xs text-ink-muted hover:text-indigo font-medium underline underline-offset-4"
          >
            Or type your question manually
          </button>
        </div>
      )}

      {/* System Alerts */}
      {systemNote && (
        <div role="alert" className="p-3.5 rounded-xl bg-rust-light border border-rust-border text-xs text-rust">
          {systemNote}
        </div>
      )}

      {/* 4. Empty State: Curated Question Starters */}
      {history.length === 0 && phase === "idle" && (
        <div className="rounded-2xl border border-line bg-paper-card p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-ink font-semibold">
              Curriculum Starters (Code-Switched Examples)
            </p>
            <span className="text-xs text-ink-muted">Tap any prompt to test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {CURATED_PROMPTS.map((item) => (
              <button
                key={item.topic}
                type="button"
                onClick={() => submitTranscript(item.prompt)}
                className="text-left rounded-xl border border-line p-4 bg-paper hover:bg-paper-elevated hover:border-indigo/40 transition-all flex flex-col justify-between gap-3 shadow-2xs group focus-visible:outline-indigo"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                      {item.subject}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-ink group-hover:text-indigo transition-colors">
                    {item.topic}
                  </p>
                </div>
                <blockquote className="text-xs text-ink-soft italic font-serif leading-relaxed border-l-2 border-ochre/60 pl-2">
                  &ldquo;{item.prompt}&rdquo;
                </blockquote>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Pedagogical Turn Stream */}
      <div ref={turnContainerRef} className="flex flex-col gap-6">
        {history.map((turn, index) => (
          <TurnCard key={turn.id || index} turn={turn} turnIndex={index + 1} />
        ))}
      </div>

      {/* Out of Curriculum Safe Fallback Note */}
      {latestTurn && latestTurn.tutorResponse == null && (
        <div className="rounded-2xl border border-line bg-paper-card p-5 text-xs text-ink-soft space-y-2">
          <p className="font-semibold text-ink">Topic Discovery Notice:</p>
          <p className="leading-relaxed">
            I could not match that question to our current secondary curriculum modules (Mathematics: signed multiplication; Science: photosynthesis; English: reading comprehension main ideas). Please try one of the starter questions above.
          </p>
        </div>
      )}

      {/* Educational AI Notice */}
      <p className="text-[11px] text-ink-muted text-center pt-4 border-t border-line/60">
        VoiceLearn Africa uses automated speech recognition & pedagogical reasoning for secondary revision. Designed for low-stakes practice with teacher oversight.
      </p>
    </div>
  );
}

function TurnCard({ turn, turnIndex }: { turn: TurnLog; turnIndex: number }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-card p-5 sm:p-6 shadow-xs flex flex-col gap-4 animate-fade-in">
      {/* Turn Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-indigo text-paper flex items-center justify-center text-[10px] font-bold">
            {turnIndex}
          </span>
          <span className="font-semibold text-ink">Turn {turnIndex}</span>
        </div>
        <div className="flex items-center gap-2 text-ink-muted text-[11px]">
          <span>{turn.timestamp}</span>
          <span>·</span>
          <span className="px-2 py-0.5 rounded bg-paper-subtle font-medium text-ink">
            Ladder Level {turn.difficulty}
          </span>
        </div>
      </div>

      {/* Learner Utterance */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-ink-muted">You Spoke</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ochre-light text-ochre font-medium border border-ochre-border">
            Code-Switch Recognized
          </span>
        </div>
        <blockquote className="text-sm sm:text-base font-serif italic text-ink bg-paper p-3.5 rounded-xl border border-line">
          &ldquo;{turn.transcript}&rdquo;
        </blockquote>
      </div>

      {/* Assessment Feedback (If answering a follow-up) */}
      {turn.assessment && (
        <div
          className={`rounded-xl p-4 text-xs sm:text-sm border space-y-1.5 ${
            turn.assessment.outcome === "correct"
              ? "bg-leaf-light border-leaf-border text-leaf-dark"
              : turn.assessment.outcome === "partially_correct"
                ? "bg-ochre-light border-ochre-border text-ochre"
                : turn.assessment.outcome === "incorrect_misconception"
                  ? "bg-rust-light border-rust-border text-rust"
                  : "bg-paper-subtle border-line text-ink-soft"
          }`}
        >
          <div className="flex items-center justify-between font-semibold">
            <span className="uppercase tracking-wider text-[10px]">
              Diagnostic Check:{" "}
              {turn.assessment.outcome === "correct"
                ? "Correct Understanding"
                : turn.assessment.outcome === "partially_correct"
                  ? "Partially Correct"
                  : turn.assessment.outcome === "incorrect_misconception"
                    ? "Misconception Detected"
                    : "Review Needed"}
            </span>
          </div>
          <p className="leading-relaxed">{turn.assessment.feedback}</p>
        </div>
      )}

      {/* Intent & Understanding Card */}
      {turn.tutorResponse && (
        <div className="rounded-xl border border-indigo-border/70 bg-indigo-light/30 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo">Topic:</span>
            <span className="text-ink font-medium">{turn.tutorResponse.topic}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-muted">Need:</span>
            <span className="capitalize px-2 py-0.5 rounded-md bg-paper-card border border-indigo-border text-indigo font-medium">
              {turn.tutorResponse.intent.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      {/* Tutor Explanation & Follow-Up Check */}
      {turn.tutorResponse && (
        <div className="space-y-4 pt-1">
          {/* Explanation */}
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider font-semibold text-ink-muted">Tutor Explanation</p>
            <p className="text-sm sm:text-base text-ink leading-relaxed font-normal">
              {turn.tutorResponse.explanation}
            </p>
          </div>

          {/* Follow-up Interactive Question */}
          <div className="rounded-xl border border-ochre-border bg-ochre-light/50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ochre" />
              <p className="text-xs uppercase tracking-wider font-bold text-ochre">Practice Follow-Up Question</p>
            </div>
            <p className="text-sm sm:text-base font-medium text-ink">
              {turn.tutorResponse.followUpQuestion}
            </p>
            <p className="text-[11px] text-ink-muted pt-1">
              Tap the microphone above to speak your answer to this question.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
