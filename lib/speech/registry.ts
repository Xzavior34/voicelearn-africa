import { SpeechProvider } from "./types";
import { saharaProvider } from "./providers/sahara";
import { whisperProvider } from "./providers/whisper";
import { wav2vec2Provider } from "./providers/wav2vec2";

/**
 * Central provider registry for VoiceLearn Africa.
 *
 * 1. Model A: Intron Sahara v2.5 (`sahara`) — Remote WebSocket API (Challenge required model)
 * 2. Model B: OpenAI Whisper Large v3 (`whisper-large-v3`) — Local open-weight inference (Apache-2.0)
 * 3. Model C: Meta Wav2Vec2 Large 960h (`wav2vec2-large-960h`) — Local open-weight baseline (Apache-2.0)
 *
 * ZERO PAID ASR API DEPENDENCIES (Sahara is the only API key required for the live product).
 */
export const speechProviders: Record<string, SpeechProvider> = {
  sahara: saharaProvider,
  "whisper-large-v3": whisperProvider,
  "wav2vec2-large-960h": wav2vec2Provider,
  // Backwards compatibility aliases
  "model-b": whisperProvider,
  "model-c": wav2vec2Provider,
};

export const PRIMARY_PROVIDER = "sahara";
export const BENCHMARK_PROVIDERS = ["sahara", "whisper-large-v3", "wav2vec2-large-960h"] as const;
