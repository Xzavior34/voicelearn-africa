import { SpeechProvider } from "./types";
import { saharaProvider } from "./providers/sahara";
import { whisperProvider } from "./providers/whisper";
import { geminiProvider } from "./providers/gemini";
import { modelBProvider } from "./providers/model-b";
import { modelCProvider } from "./providers/model-c";

/**
 * Central provider registry for VoiceLearn Africa.
 *
 * 1. Model A: Intron Sahara v2.5 (`sahara`) — primary live provider.
 * 2. Model B: OpenAI Whisper Large v3 (`whisper-large-v3`).
 * 3. Model C: Google Gemini Audio (`gemini`).
 *
 * `model-b` and `model-c` aliases are maintained for backwards compatibility.
 */
export const speechProviders: Record<string, SpeechProvider> = {
  sahara: saharaProvider,
  "whisper-large-v3": whisperProvider,
  gemini: geminiProvider,
  "model-b": whisperProvider || modelBProvider,
  "model-c": geminiProvider || modelCProvider,
};

export const PRIMARY_PROVIDER = "sahara";
export const BENCHMARK_PROVIDERS = ["sahara", "whisper-large-v3", "gemini"] as const;

