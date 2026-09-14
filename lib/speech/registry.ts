import { SpeechProvider } from "./types";
import { saharaProvider } from "./providers/sahara";
import { whisperProvider } from "./providers/whisper";
import { whisperBaseProvider } from "./providers/whisper-base";
import { wav2vec2Provider } from "./providers/wav2vec2";

/**
 * Central provider registry for VoiceLearn Africa.
 *
 * 1. Model A: Intron Sahara v2.5 (`sahara`) — Remote WebSocket API.
 *    This is the PRODUCTION speech model for the live learner-facing
 *    tutor. It is not swapped out for a local model.
 * 2. Model B: OpenAI Whisper Tiny (`whisper-tiny`) — Local, filesystem-only
 *    inference (Apache-2.0). BENCHMARK COMPARATOR ONLY.
 * 3. Model C: OpenAI Whisper Base (`whisper-base`) — Local, filesystem-only
 *    inference (Apache-2.0). BENCHMARK COMPARATOR ONLY.
 * 4. Model D: Meta Wav2Vec2 Base 960h (`wav2vec2-base-960h`) — Local,
 *    filesystem-only inference (Apache-2.0). An English/LibriSpeech
 *    general-ASR baseline — NOT an African-language or Pidgin
 *    specialist. BENCHMARK COMPARATOR ONLY.
 *
 * All three local models were deliberately chosen as small, practical
 * checkpoints for constrained-hardware benchmarking. See
 * LOCAL_MODEL_SETUP.md for exactly what to download and where.
 *
 * ZERO PAID ASR API DEPENDENCIES for the three local comparators. Sahara
 * is the only API key required, and only for the live product.
 */
export const speechProviders: Record<string, SpeechProvider> = {
  sahara: saharaProvider,
  "whisper-tiny": whisperProvider,
  "whisper-base": whisperBaseProvider,
  "wav2vec2-base-960h": wav2vec2Provider,

  // Backwards compatibility aliases
  "model-b": whisperProvider,
  "model-c": wav2vec2Provider,
};

export const PRIMARY_PROVIDER = "sahara";

export const BENCHMARK_PROVIDERS = [
  "sahara",
  "whisper-tiny",
  "whisper-base",
  "wav2vec2-base-960h",
] as const;
