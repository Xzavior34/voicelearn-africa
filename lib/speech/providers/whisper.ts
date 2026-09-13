/**
 * OpenAI Whisper Large v3 speech provider.
 *
 * Provider identifier: whisper-large-v3
 * Model identifier: WHISPER_MODEL || "whisper-large-v3" (or "whisper-1")
 *
 * Supports:
 *   1. Official OpenAI Audio Transcriptions API (https://api.openai.com/v1/audio/transcriptions)
 *   2. Any custom/local OpenAI-compatible Whisper v3 endpoint (via WHISPER_API_URL)
 *
 * If credentials are not set, reports isLive: false and throws
 * REQUIRES_API_ACCESS with honest, un-fabricated status.
 */

import {
  AudioInput,
  SpeechProvider,
  SpeechProviderError,
  SpeechResult,
  LanguagePair,
  ProviderHealthResult,
} from "../types";

const DEFAULT_OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";

export const WHISPER_SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = ["en", "en-pcm", "en-yo"];

function getWhisperConfig(): {
  url: string;
  apiKey: string | null;
  model: string;
} {
  const rawKey = process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY;
  const apiKey = rawKey && rawKey.trim().length > 0 && rawKey !== "null" && rawKey !== "undefined" ? rawKey.trim() : null;
  const url = process.env.WHISPER_API_URL || DEFAULT_OPENAI_TRANSCRIPTION_URL;
  // If hitting the official OpenAI endpoint, default model is whisper-1 (Whisper Large v3) unless specified.
  const model = process.env.WHISPER_MODEL || (url.includes("api.openai.com") ? "whisper-1" : "whisper-large-v3");
  return { url, apiKey, model };
}

function assertConfigured(): { url: string; apiKey: string; model: string } {
  const { url, apiKey, model } = getWhisperConfig();
  if (!apiKey) {
    throw new SpeechProviderError(
      "whisper-large-v3",
      "REQUIRES_API_ACCESS",
      "OpenAI Whisper is not configured. Set OPENAI_API_KEY (or WHISPER_API_KEY) in .env.local to enable live Whisper transcription.",
    );
  }
  return { url, apiKey, model };
}

export const whisperProvider: SpeechProvider = {
  id: "whisper-large-v3",
  name: "OpenAI Whisper Large v3",
  get model(): string {
    return getWhisperConfig().model;
  },
  get isLive(): boolean {
    return Boolean(getWhisperConfig().apiKey);
  },
  supportedLanguagePairs: WHISPER_SUPPORTED_LANGUAGE_PAIRS,

  async transcribe(input: AudioInput): Promise<SpeechResult> {
    const configuredModel = getWhisperConfig().model;

    if (input.devTranscriptOverride !== undefined) {
      return {
        provider: "whisper-large-v3",
        providerName: "whisper-large-v3 (dev override — NOT a live response)",
        model: `${configuredModel} (dev-override)`,
        transcript: input.devTranscriptOverride,
        confidence: null,
        languagePair: input.languagePair,
        latencyMs: 0,
        success: true,
      };
    }

    const { url, apiKey, model } = assertConfigured();

    if (!input.audioBytes || input.audioBytes.byteLength === 0) {
      throw new SpeechProviderError("whisper-large-v3", "EMPTY_AUDIO", "No audio provided.");
    }

    const started = Date.now();
    try {
      const ext = input.mimeType.includes("wav") ? "wav" : input.mimeType.includes("mp3") ? "mp3" : "webm";
      const blob = new Blob([input.audioBytes], { type: input.mimeType });
      const formData = new FormData();
      formData.append("file", blob, `audio.${ext}`);
      formData.append("model", model);
      formData.append("response_format", "verbose_json");

      // Set language hint if English
      if (input.languagePair === "en") {
        formData.append("language", "en");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const latencyMs = Date.now() - started;

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errJson = (await response.json()) as { error?: { message?: string } };
          if (errJson?.error?.message) errorMsg = errJson.error.message;
        } catch {
          // ignore non-json error
        }

        if (response.status === 401 || response.status === 403) {
          throw new SpeechProviderError("whisper-large-v3", "AUTHENTICATION_ERROR", `Whisper auth failed: ${errorMsg}`);
        }
        if (response.status === 429) {
          throw new SpeechProviderError("whisper-large-v3", "QUOTA_EXCEEDED", `Whisper quota/rate limit: ${errorMsg}`);
        }
        throw new SpeechProviderError("whisper-large-v3", "NETWORK_ERROR", `Whisper request failed: ${errorMsg}`);
      }

      const json = (await response.json()) as {
        text?: string;
        language?: string;
        duration?: number;
      };

      if (typeof json.text !== "string") {
        throw new SpeechProviderError(
          "whisper-large-v3",
          "MALFORMED_RESPONSE",
          "Whisper response did not contain a text transcript field.",
        );
      }

      return {
        provider: "whisper-large-v3",
        providerName: "whisper-large-v3",
        model,
        transcript: json.text.trim(),
        confidence: null,
        languagePair: input.languagePair,
        latencyMs,
        success: true,
        metadata: {
          audioDurationMs: json.duration ? Math.round(json.duration * 1000) : undefined,
          mode: "openai-transcriptions-api",
        },
        raw: json,
      };
    } catch (err) {
      if (err instanceof SpeechProviderError) throw err;
      throw new SpeechProviderError(
        "whisper-large-v3",
        "UNKNOWN",
        `Unexpected Whisper failure: ${(err as Error).message}`,
      );
    }
  },

  async checkHealth(): Promise<ProviderHealthResult> {
    const checkedAt = new Date().toISOString();
    const { apiKey, model } = getWhisperConfig();
    if (!apiKey) {
      return {
        state: "not_configured",
        message: "OPENAI_API_KEY (or WHISPER_API_KEY) is not set.",
        checkedAt,
        latencyMs: null,
        model,
      };
    }

    const started = Date.now();
    try {
      // Fast check against OpenAI models API
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const latencyMs = Date.now() - started;
      if (res.ok) {
        return {
          state: "authenticated",
          message: `OpenAI API key authenticated successfully. Target model: ${model}.`,
          checkedAt,
          latencyMs,
          model,
        };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          state: "auth_failed",
          message: "OpenAI API rejected the key (401 Unauthorized).",
          checkedAt,
          latencyMs,
          model,
        };
      }
      if (res.status === 429) {
        return {
          state: "quota_exceeded",
          message: "OpenAI API returned 429 Quota Exceeded / Rate Limit.",
          checkedAt,
          latencyMs,
          model,
        };
      }
      return {
        state: "unreachable",
        message: `OpenAI check returned HTTP ${res.status}.`,
        checkedAt,
        latencyMs,
        model,
      };
    } catch (err) {
      return {
        state: "unreachable",
        message: `Could not reach OpenAI endpoint: ${(err as Error).message}`,
        checkedAt,
        latencyMs: null,
        model,
      };
    }
  },
};
