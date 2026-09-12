"use client";

import { useState, useCallback } from "react";
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
  transcript: string;
  assessment: AssessmentResult | null;
  tutorResponse: TutorResponse | null;
  understandingSummary: string;
}

const EXAMPLE_PROMPTS = [
  "Why negative times negative go give positive?",
  "I understand say chlorophyll dey important, but why exactly?",
  "How do I identify the main idea of this passage?",
];

export default function VoiceTutor() {
  const recorder = useSpeechRecorder();
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<LearningSession>(createInitialSession());
  const [history, setHistory] = useState<TurnLog[]>([]);
  const [manualText, setManualText] = useState("");
  const [speechErrorNote, setSpeechErrorNote] = useState<string | null>(null);
  const [systemNote, setSystemNote] = useState<string | null>(null);

  const isFollowUp = session.topic !== "";
  const latestTurn = history[history.length - 1];

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
          setSystemNote("That wasn't quite right. Try again.");
          return;
        }
        const data = await res.json();
        setSession(data.session);
        setHistory((h) => [
          ...h,
          {
            transcript,
            assessment: data.assessment,
            tutorResponse: data.tutorResponse,
            understandingSummary: data.understandingSummary,
          },
        ]);
        setPhase("responded");
      } catch {
        setPhase("tutor_failed");
        setSystemNote("Network trouble reaching the tutor. Try again.");
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
              ? "Sahara speech recognition isn't connected in this build (no live API credentials configured). You can type what you said below to try the rest of the tutor."
              : "We couldn't understand that recording clearly. Try moving closer to your microphone or speak again.",
          );
          return;
        }
        await submitTranscript(data.result.transcript);
      } catch {
        setPhase("speech_unavailable");
        setSpeechErrorNote("Network trouble reaching the speech service. You can type what you said instead.");
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
        setSpeechErrorNote("We didn't catch any audio. Try again, or type your question below.");
        return;
      }
      await submitAudio(blob);
    } else {
      setPhase("recording");
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

  const micLabel =
    recorder.status === "recording"
      ? `Listening… ${recorder.durationSeconds}s (tap to stop)`
      : isFollowUp
        ? "Speak your answer"
        : "Hold to speak";

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-8 w-full">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="inline-block h-2 w-2 rounded-full bg-leaf" aria-hidden />
        English + Nigerian Pidgin
      </div>

      {/* Mic control — the hero interaction */}
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative flex items-center justify-center">
          {recorder.status === "recording" && (
            <span className="absolute h-24 w-24 rounded-full bg-ochre listen-ring" aria-hidden />
          )}
          <button
            type="button"
            onClick={handleMicPress}
            disabled={phase === "processing_speech" || phase === "processing_tutor"}
            aria-pressed={recorder.status === "recording"}
            className="relative h-20 w-20 rounded-full bg-indigo text-paper flex items-center justify-center hover:bg-indigo-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MicIcon />
          </button>
        </div>
        <p className="text-sm text-ink-soft" aria-live="polite">
          {phase === "processing_speech"
            ? "Processing your speech…"
            : phase === "processing_tutor"
              ? "Thinking through your question…"
              : micLabel}
        </p>
        {recorder.errorMessage && (
          <p role="alert" className="text-sm text-rust text-center max-w-sm">
            {recorder.errorMessage}
          </p>
        )}
      </div>

      {/* Speech fallback / error state */}
      {phase === "speech_unavailable" && (
        <div className="border border-line rounded-lg p-4 flex flex-col gap-3 bg-line-soft/40">
          <p className="text-sm text-ink-soft">{speechErrorNote}</p>
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="manual-transcript" className="sr-only">
              Type what you said
            </label>
            <input
              id="manual-transcript"
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type what you said…"
              className="flex-1 rounded-md border border-line px-3 py-2 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-indigo"
            />
            <button
              type="submit"
              className="rounded-md bg-indigo text-paper px-4 py-2 text-sm font-medium hover:bg-indigo-soft transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {systemNote && (
        <p role="alert" className="text-sm text-rust">{systemNote}</p>
      )}

      {/* Conversation history */}
      {history.length === 0 && phase === "idle" && (
        <div className="flex flex-col gap-2 text-sm text-ink-soft border-t border-line pt-6">
          <p className="text-ink-soft/70 uppercase tracking-wide text-xs">Try asking</p>
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => submitTranscript(p)}
              className="text-left italic hover:text-ink transition-colors"
            >
              &ldquo;{p}&rdquo;
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {history.map((turn, i) => (
          <TurnCard key={i} turn={turn} />
        ))}
      </div>

      {latestTurn?.tutorResponse == null && history.length > 0 && (
        <p className="text-sm text-ink-soft border-t border-line pt-4">
          I couldn&apos;t match that to a topic in the current curriculum (mathematics: signed
          multiplication, science: photosynthesis, English: main idea). Try one of the example
          questions above.
        </p>
      )}
    </div>
  );
}

function TurnCard({ turn }: { turn: TurnLog }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line pt-6">
      <p className="text-ink-soft text-sm">
        <span className="font-medium text-ink">You said:</span> &ldquo;{turn.transcript}&rdquo;
      </p>

      {turn.assessment && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            turn.assessment.outcome === "correct"
              ? "bg-leaf/10 text-leaf"
              : turn.assessment.outcome === "uncertain"
                ? "bg-line-soft text-ink-soft"
                : "bg-rust/10 text-rust"
          }`}
        >
          {turn.assessment.feedback}
        </div>
      )}

      {turn.tutorResponse && !turn.assessment && (
        <div className="rounded-md border border-line px-4 py-3 flex flex-col gap-1 bg-paper">
          <p className="text-xs uppercase tracking-wide text-ink-soft/70">I understood</p>
          <p className="text-sm text-ink">
            <span className="font-medium">Topic:</span> {turn.tutorResponse.topic}
          </p>
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">Learning need:</span>{" "}
            {turn.tutorResponse.intent.replace("_", " ")}
          </p>
        </div>
      )}

      {turn.tutorResponse && (
        <div className="flex flex-col gap-3">
          <p className="text-ink leading-relaxed">{turn.tutorResponse.explanation}</p>
          <p className="font-medium text-ink">{turn.tutorResponse.followUpQuestion}</p>
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
