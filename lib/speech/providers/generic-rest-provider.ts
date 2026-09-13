/**
 * Generic configurable REST speech provider.
 *
 * Model B and Model C in the benchmark are meant to be REAL, accessible
 * speech models used as a comparison baseline against Sahara (per the
 * competition brief). Rather than hard-code a specific vendor we don't
 * have credentials for, this factory lets anyone plug in an actual ASR
 * REST endpoint (e.g. a hosted Whisper endpoint, a cloud STT API) via
 * environment variables, using the same honest "throw if unconfigured"
 * pattern as Sahara. This keeps the benchmark's 3-provider shape real
 * and swappable instead of inventing a name for a model we can't call.
 */

import {
  AudioInput,
  SpeechProvider,
  SpeechProviderError,
  SpeechResult,
  LanguagePair,
} from "../types";

export interface GenericRestProviderConfig {
  name: string;
  urlEnvVar: string;
  keyEnvVar: string;
  supportedLanguagePairs: LanguagePair[];
}

export function createGenericRestProvider(
  config: GenericRestProviderConfig,
): SpeechProvider {
  const { name, urlEnvVar, keyEnvVar, supportedLanguagePairs } = config;

  function assertConfigured(): { url: string; key: string } {
    const url = process.env[urlEnvVar];
    const key = process.env[keyEnvVar];
    if (!url || !key) {
      throw new SpeechProviderError(
        name,
        "REQUIRES_API_ACCESS",
        `${name} is not configured. Set ${urlEnvVar} and ${keyEnvVar} to enable it.`,
      );
    }
    return { url, key };
  }

  return {
    name,
    isLive: Boolean(process.env[urlEnvVar] && process.env[keyEnvVar]),
    supportedLanguagePairs,

    async transcribe(input: AudioInput): Promise<SpeechResult> {
      if (input.devTranscriptOverride !== undefined) {
        return {
          transcript: input.devTranscriptOverride,
          confidence: null,
          languagePair: input.languagePair,
          latencyMs: 0,
          providerName: `${name} (dev override — NOT a live response)`,
        };
      }

      const { url, key } = assertConfigured();

      if (!input.audioBytes || input.audioBytes.byteLength === 0) {
        throw new SpeechProviderError(name, "EMPTY_AUDIO", "No audio provided.");
      }

      const started = Date.now();
      try {
        const form = new FormData();
        form.append(
          "audio",
          new Blob([input.audioBytes], { type: input.mimeType }),
          "utterance.webm",
        );
        form.append("language_pair", input.languagePair);

        const response = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: form,
        });
        const latencyMs = Date.now() - started;
        if (!response.ok) {
          throw new SpeechProviderError(
            name,
            "NETWORK_ERROR",
            `${name} request failed with status ${response.status}.`,
          );
        }
        const json = (await response.json()) as Record<string, unknown>;
        if (typeof json.transcript !== "string") {
          throw new SpeechProviderError(
            name,
            "MALFORMED_RESPONSE",
            `${name} response did not contain a string 'transcript' field.`,
          );
        }
        return {
          transcript: json.transcript,
          confidence: typeof json.confidence === "number" ? json.confidence : null,
          languagePair: input.languagePair,
          latencyMs,
          providerName: name,
          raw: json,
        };
      } catch (err) {
        if (err instanceof SpeechProviderError) throw err;
        throw new SpeechProviderError(
          name,
          "UNKNOWN",
          `Unexpected ${name} failure: ${(err as Error).message}`,
        );
      }
    },
  };
}
