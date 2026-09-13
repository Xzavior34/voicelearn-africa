/**
 * Google Gemini Speech/Audio provider.
 *
 * Provider identifier: gemini
 * Model identifier: GEMINI_MODEL || "gemini-1.5-flash"
 *
 * Uses the official Google Generative Language REST API to process audio
 * input with strict transcription prompting to extract verbatim spoken text.
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

export const GEMINI_SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = ["en", "en-pcm", "en-yo"];

function getGeminiConfig(): {
  apiKey: string | null;
  model: string;
} {
  const rawKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = rawKey && rawKey.trim().length > 0 && rawKey !== "null" && rawKey !== "undefined" ? rawKey.trim() : null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return { apiKey, model };
}

function assertConfigured(): { apiKey: string; model: string } {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) {
    throw new SpeechProviderError(
      "gemini",
      "REQUIRES_API_ACCESS",
      "Google Gemini is not configured. Set GOOGLE_API_KEY (or GEMINI_API_KEY) in .env.local to enable live Gemini speech recognition.",
    );
  }
  return { apiKey, model };
}

export const geminiProvider: SpeechProvider = {
  id: "gemini",
  name: "Google Gemini Audio",
  get model(): string {
    return getGeminiConfig().model;
  },
  get isLive(): boolean {
    return Boolean(getGeminiConfig().apiKey);
  },
  supportedLanguagePairs: GEMINI_SUPPORTED_LANGUAGE_PAIRS,

  async transcribe(input: AudioInput): Promise<SpeechResult> {
    const configuredModel = getGeminiConfig().model;

    if (input.devTranscriptOverride !== undefined) {
      return {
        provider: "gemini",
        providerName: "gemini (dev override — NOT a live response)",
        model: `${configuredModel} (dev-override)`,
        transcript: input.devTranscriptOverride,
        confidence: null,
        languagePair: input.languagePair,
        latencyMs: 0,
        success: true,
      };
    }

    const { apiKey, model } = assertConfigured();

    if (!input.audioBytes || input.audioBytes.byteLength === 0) {
      throw new SpeechProviderError("gemini", "EMPTY_AUDIO", "No audio provided.");
    }

    const started = Date.now();
    try {
      const base64Audio = Buffer.from(input.audioBytes).toString("base64");
      const mimeType = input.mimeType || "audio/wav";

      const prompt =
        "You are an exact, verbatim speech-to-text transcriber for African educational speech. " +
        "Transcribe the audio verbatim in its original spoken language and dialect (including Nigerian Pidgin or Yoruba if spoken). " +
        "Return ONLY the exact transcribed text with no quotes, no conversational filler, no explanations, and no markdown formatting.";

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Audio,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 256,
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const latencyMs = Date.now() - started;

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errJson = (await response.json()) as { error?: { message?: string } };
          if (errJson?.error?.message) errorMsg = errJson.error.message;
        } catch {
          // ignore
        }

        if (response.status === 400 && errorMsg.includes("API_KEY_INVALID")) {
          throw new SpeechProviderError("gemini", "AUTHENTICATION_ERROR", `Gemini API key invalid: ${errorMsg}`);
        }
        if (response.status === 429 || errorMsg.includes("RESOURCE_EXHAUSTED")) {
          throw new SpeechProviderError("gemini", "QUOTA_EXCEEDED", `Gemini quota/rate limit: ${errorMsg}`);
        }
        throw new SpeechProviderError("gemini", "NETWORK_ERROR", `Gemini request failed: ${errorMsg}`);
      }

      const json = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof candidateText !== "string") {
        throw new SpeechProviderError(
          "gemini",
          "MALFORMED_RESPONSE",
          "Gemini response did not contain text parts.",
        );
      }

      // Clean any accidental markdown quotes/backticks
      const cleanTranscript = candidateText.trim().replace(/^["'`]+|["'`]+$/g, "");

      return {
        provider: "gemini",
        providerName: "gemini",
        model,
        transcript: cleanTranscript,
        confidence: null,
        languagePair: input.languagePair,
        latencyMs,
        success: true,
        metadata: {
          mode: "gemini-audio-generateContent",
        },
        raw: json,
      };
    } catch (err) {
      if (err instanceof SpeechProviderError) throw err;
      throw new SpeechProviderError(
        "gemini",
        "UNKNOWN",
        `Unexpected Gemini failure: ${(err as Error).message}`,
      );
    }
  },

  async checkHealth(): Promise<ProviderHealthResult> {
    const checkedAt = new Date().toISOString();
    const { apiKey, model } = getGeminiConfig();
    if (!apiKey) {
      return {
        state: "not_configured",
        message: "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set.",
        checkedAt,
        latencyMs: null,
        model,
      };
    }

    const started = Date.now();
    try {
      // Fast check with minimal prompt
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      const latencyMs = Date.now() - started;
      if (res.ok) {
        return {
          state: "authenticated",
          message: `Google Gemini API authenticated successfully. Model: ${model}.`,
          checkedAt,
          latencyMs,
          model,
        };
      }
      let errDetail = `HTTP ${res.status}`;
      try {
        const errJson = (await res.json()) as { error?: { message?: string } };
        if (errJson?.error?.message) errDetail = `${errDetail}: ${errJson.error.message}`;
      } catch {
        // ignore
      }

      if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
        return {
          state: "auth_failed",
          message: `Google Gemini rejected request (${errDetail}).`,
          checkedAt,
          latencyMs,
          model,
        };
      }
      if (res.status === 429) {
        return {
          state: "quota_exceeded",
          message: `Google Gemini quota exceeded (${errDetail}).`,
          checkedAt,
          latencyMs,
          model,
        };
      }
      return {
        state: "unreachable",
        message: `Google Gemini returned ${errDetail}.`,
        checkedAt,
        latencyMs,
        model,
      };
    } catch (err) {
      return {
        state: "unreachable",
        message: `Could not reach Google Gemini: ${(err as Error).message}`,
        checkedAt,
        latencyMs: null,
        model,
      };
    }
  },
};
