"use client";

import { useCallback, useRef, useState } from "react";

export type RecorderStatus =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "stopped"
  | "permission_denied"
  | "unsupported"
  | "error";

/**
 * Thin wrapper around the real browser MediaRecorder API. No fake
 * waveform, no simulated audio — this actually requests microphone
 * access and records real audio into a Blob. Behavior that cannot be
 * exercised from this container (an actual physical microphone) is
 * flagged in README.md as "LOCAL DEVICE TEST REQUIRED" — the code path
 * itself is real.
 */
export function useSpeechRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    if (typeof window === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
      setStatus("unsupported");
      setErrorMessage("This browser doesn't support microphone recording.");
      return;
    }

    setStatus("requesting_permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        setStatus("error");
        setErrorMessage("Recording failed unexpectedly. Please try again.");
        cleanupStream();
      };

      recorder.start();
      setStatus("recording");
      setDurationSeconds(0);
      timerRef.current = setInterval(() => {
        setDurationSeconds((d) => d + 1);
      }, 1000);
    } catch {
      setStatus("permission_denied");
      setErrorMessage(
        "We couldn't access your microphone. Check your browser's microphone permission and try again.",
      );
    }
  }, [cleanupStream]);

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        cleanupStream();
        setStatus("stopped");
        if (chunksRef.current.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        resolve(blob);
      };
      recorder.stop();
    });
  }, [cleanupStream]);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanupStream();
    chunksRef.current = [];
    setStatus("idle");
    setDurationSeconds(0);
  }, [cleanupStream]);

  const reset = useCallback(() => {
    setStatus("idle");
    setDurationSeconds(0);
    setErrorMessage(null);
  }, []);

  return { status, durationSeconds, errorMessage, start, stop, cancel, reset };
}
