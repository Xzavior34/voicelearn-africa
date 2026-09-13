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
 *
 * `audioLevel` is a real, live 0–1 amplitude reading taken from the same
 * MediaStream via the native Web Audio API (AnalyserNode) — not a
 * decorative/simulated value. It only updates while actually recording;
 * it is 0 at every other time, so a UI driven by it can never display
 * microphone activity that isn't genuinely happening.
 */
export function useSpeechRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelFrameRef = useRef<number | null>(null);

  const stopLevelMetering = useCallback(() => {
    if (levelFrameRef.current !== null) {
      cancelAnimationFrame(levelFrameRef.current);
      levelFrameRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startLevelMetering = useCallback((stream: MediaStream) => {
    // Real-time amplitude metering via the native Web Audio API — no
    // added dependency. If this fails (unsupported browser), the
    // recording itself still works; the voice visual just won't react
    // to real amplitude and falls back to its calm idle motion.
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const average = sum / data.length / 255; // normalize to 0–1
        setAudioLevel(average);
        levelFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Metering is a purely cosmetic enhancement — never let it affect
      // whether recording itself works.
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopLevelMetering();
  }, [stopLevelMetering]);

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
      startLevelMetering(stream);
    } catch {
      setStatus("permission_denied");
      setErrorMessage(
        "We couldn't access your microphone. Check your browser's microphone permission and try again.",
      );
    }
  }, [cleanupStream, startLevelMetering]);

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

  return { status, durationSeconds, errorMessage, audioLevel, start, stop, cancel, reset };
}
