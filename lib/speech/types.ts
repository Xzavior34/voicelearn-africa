/**
 * Speech provider abstraction.
 *
 * Every speech understanding backend (Sahara, or any comparison model)
 * implements the same `SpeechProvider` interface. The rest of the
 * application — the tutor, the benchmark harness, the UI — never talks
 * to a specific vendor. It talks to this interface. Swapping or adding
 * a provider never requires touching tutor or benchmark code.
 */

export type LanguagePair =
  | "en" // Standard English only
  | "pcm" // Monolingual Nigerian Pidgin
  | "en-pcm" // English <-> Nigerian Pidgin (Tier 1)
  | "en-yo"; // English <-> Yoruba (Tier 2, only if provider genuinely supports it)

/**
 * Input handed to a provider. In the browser this originates from
 * MediaRecorder as a Blob; on the server it arrives as bytes.
 * `referenceText` is ONLY present for offline benchmark samples where a
 * human-authored ground truth transcript exists — it is never sent to a
 * live provider as part of a real learner interaction.
 */
export interface AudioInput {
  /** Raw audio bytes. Empty in text-only development/test fixtures. */
  audioBytes: ArrayBuffer | null;
  mimeType: string;
  /** Approximate duration in seconds, if known. */
  durationSeconds?: number;
  /** Declared language pair the learner is expected to be speaking. */
  languagePair: LanguagePair;
  /** Optional file path to normalized WAV on disk. */
  audioPath?: string;
  /**
   * Development/benchmark-only escape hatch: lets the harness and unit
   * tests exercise the pipeline downstream of ASR without needing a live
   * audio round trip. Real production calls must leave this undefined —
   * providers should not accept it from client requests (see the /api
   * route, which strips it from untrusted input).
   */
  devTranscriptOverride?: string;
}

export interface SpeechResult {
  /** Provider identifier, e.g. "sahara", "whisper-large-v3", "wav2vec2-large-960h". */
  provider: string;
  /** Backwards-compatible alias for provider identifier. */
  providerName: string;
  /** Actual configured model identifier, e.g. "sahara-v2.5", "openai/whisper-large-v3", "facebook/wav2vec2-large-960h". */
  model: string;
  /** Execution environment for the model. */
  runtime: "remote-api" | "local";
  /** The provider's transcription of what was spoken. */
  transcript: string;
  /** 0-1 confidence score, ONLY if the provider genuinely reports one. */
  confidence: number | null;
  /** Detected/declared language pair. */
  languagePair: LanguagePair;
  /** Wall-clock time the provider call took, in milliseconds. */
  latencyMs: number;
  /** Whether transcription succeeded. */
  success: boolean;
  /** Error message if transcription failed. */
  error?: string;
  /** Audio and encoding metadata. */
  metadata?: {
    audioSha256?: string;
    audioDurationMs?: number;
    sampleRate?: number;
    channels?: number;
    device?: string;
    deviceName?: string;
    coldStartMs?: number;
    warmInferenceLatencyMs?: number;
    mode?: string;
  };
  /** Raw, provider-specific response object for debugging. */
  raw?: unknown;
}

/**
 * Thrown by a provider when it cannot produce a result. Distinct from a
 * low-confidence result: this represents an actual failure (network,
 * auth, malformed audio, unsupported language, etc.) that the caller
 * must handle explicitly rather than silently guessing.
 */
export class SpeechProviderError extends Error {
  constructor(
    public readonly providerName: string,
    public readonly code:
      | "REQUIRES_API_ACCESS"
      | "UNSUPPORTED_LANGUAGE"
      | "EMPTY_AUDIO"
      | "NETWORK_ERROR"
      | "TIMEOUT"
      | "MALFORMED_RESPONSE"
      | "AUDIO_CONVERSION_FAILED"
      | "AUTHENTICATION_ERROR"
      | "QUOTA_EXCEEDED"
      | "RESOURCE_EXHAUSTED"
      | "CHUNK_SIZE_ERROR"
      | "INSUFFICIENT_AUDIO_ACTIVITY"
      | "SESSION_TIME_LIMIT_EXCEEDED"
      | "MODEL_DOWNLOAD_REQUIRED"
      | "INSUFFICIENT_LOCAL_RESOURCES"
      | "LOCAL_WORKER_ERROR"
      | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "SpeechProviderError";
  }
}

export type ProviderHealthState =
  | "not_configured"
  | "authenticated"
  | "auth_failed"
  | "quota_exceeded"
  | "unreachable"
  | "ready"
  | "model_ready"
  | "model_download_required"
  | "insufficient_resources"
  | "unknown_error";

export interface ProviderHealthResult {
  state: ProviderHealthState;
  message: string;
  checkedAt: string; // ISO timestamp
  latencyMs: number | null;
  model?: string;
  runtime?: "remote-api" | "local";
  device?: string;
}

export interface SpeechProvider {
  /** Unique provider identifier, e.g. "sahara", "whisper-large-v3", "wav2vec2-large-960h". */
  readonly id: string;
  /** Human-readable name, e.g. "Intron Sahara v2.5". */
  readonly name: string;
  /** The specific model name used, e.g. "sahara-v2.5". */
  readonly model: string;
  /** Runtime execution model. */
  readonly runtime: "remote-api" | "local";
  /** Whether this provider is genuinely callable right now (has live credentials or local model loaded). */
  readonly isLive: boolean;
  /** Which language pairs this provider claims support for. */
  readonly supportedLanguagePairs: LanguagePair[];
  transcribe(input: AudioInput): Promise<SpeechResult>;
  /**
   * Optional real connectivity/auth check, distinct from `isLive`.
   */
  checkHealth?(): Promise<ProviderHealthResult>;
}
