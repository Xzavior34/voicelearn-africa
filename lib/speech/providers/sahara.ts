/**
 * Sahara speech provider — real streaming STT contract.
 *
 * Source of truth: https://docs.voice.intron.io/ (as supplied by the
 * project owner on 2026-09-12). This file replaces the earlier
 * best-effort HTTP-multipart placeholder with the ACTUAL documented
 * protocol:
 *
 *   Endpoint:  wss://infer.voice.intron.io/stt/v1/stream
 *   Auth:      Authorization: Bearer <SAHARA_API_KEY>   (server-side only)
 *   Audio:     PCM16 little-endian, 16kHz, mono, base64-encoded,
 *              1KB-32KB chunks, sent as INPUT_AUDIO_CHUNK messages.
 *   Completion: a COMMIT message, followed by a COMMITTED_TRANSCRIPT
 *              response containing the final transcript_text.
 *
 * STATUS: code is complete and real, but NOT verified live — no
 * SAHARA_API_KEY exists in the environment this was written in. Every
 * "NOT YET VERIFIED" comment below marks an assumption about protocol
 * details docs.voice.intron.io didn't fully specify (mainly: how
 * session parameters are actually passed, and the exact ordering
 * requirement around SESSION_CREATED). Adjust those specific spots —
 * and only those — if a live session behaves differently.
 *
 * To make this live:
 *   1. Set SAHARA_API_KEY in .env.local (never commit it, never paste
 *      it in chat).
 *   2. Optionally set SAHARA_WS_URL to override the default endpoint
 *      (e.g. for a staging environment).
 *   3. Run `npm run sahara:health` for a fast, real authentication
 *      check before running the full benchmark.
 *
 * Nothing else in the app (tutor, benchmark, UI) needs to change —
 * they only depend on the shared `SpeechProvider` interface.
 */

import WebSocket from "ws";
import {
  AudioInput,
  SpeechProvider,
  SpeechProviderError,
  SpeechResult,
  LanguagePair,
  ProviderHealthResult,
} from "../types";
import { convertToPcm16Mono16k, chunkPcm16, AudioConversionError } from "../audio-conversion";

const DEFAULT_WS_URL = "wss://infer.voice.intron.io/stt/v1/stream";

// Per docs.voice.intron.io, pcm and yo are documented as SUPPORTED
// code-switched languages. This is DOCUMENTED support, not a
// live-verified test — see README "Limitations" for the distinction.
const SAHARA_SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = ["en", "en-pcm", "en-yo"];

// Our internal LanguagePair -> Sahara's use_language_asr_input code.
// "en" -> "en" is NOT explicitly confirmed by the supplied docs (only
// the code-switched codes pcm/yo/ig/ha/sw/zu/etc. were listed) — kept
// as the most reasonable default and flagged here for verification.
const LANGUAGE_CODE_MAP: Record<LanguagePair, string> = {
  en: "en", // NOT YET VERIFIED
  "en-pcm": "pcm",
  "en-yo": "yo",
};

const SESSION_CREATED_TIMEOUT_MS = 10_000;
const COMMITTED_TRANSCRIPT_TIMEOUT_MS = 30_000;

function assertConfigured(): { wsUrl: string; apiKey: string } {
  const apiKey = process.env.SAHARA_API_KEY;
  if (!apiKey) {
    throw new SpeechProviderError(
      "sahara",
      "REQUIRES_API_ACCESS",
      "SAHARA_API_KEY is not set. Add it to .env.local (never commit it, never paste it in chat) to enable live Sahara transcription.",
    );
  }
  const wsUrl = process.env.SAHARA_WS_URL || DEFAULT_WS_URL;
  return { wsUrl, apiKey };
}

type SaharaMessage =
  | { message_type: "SESSION_CREATED"; [k: string]: unknown }
  | { message_type: "PARTIAL_TRANSCRIPT"; transcript_text?: string; [k: string]: unknown }
  | { message_type: "COMMITTED_TRANSCRIPT"; transcript_id: string; transcript_text: string; audio_len: number }
  | { message_type: "ERROR" | "INPUT_ERROR"; error?: string; message?: string; [k: string]: unknown }
  | { message_type: "AUTHENTICATION_ERROR"; [k: string]: unknown }
  | { message_type: "RESOURCE_EXHAUSTED"; [k: string]: unknown }
  | { message_type: "QUOTA_EXCEEDED"; [k: string]: unknown }
  | { message_type: "CHUNK_SIZE_TOO_SMALL" | "CHUNK_SIZE_TOO_LARGE"; [k: string]: unknown }
  | { message_type: "INSUFFICIENT_AUDIO_ACTIVITY"; [k: string]: unknown }
  | { message_type: "SESSION_TIME_LIMIT_EXCEEDED"; [k: string]: unknown }
  | { message_type: string; [k: string]: unknown };

/**
 * Runs one full streaming session: connect -> (wait for SESSION_CREATED)
 * -> stream INPUT_AUDIO_CHUNK messages -> COMMIT -> wait for
 * COMMITTED_TRANSCRIPT. Rejects with a specific SpeechProviderError for
 * every documented Sahara error message_type — never silently swallows
 * one or invents a transcript.
 */
function runSaharaSession(
  wsUrl: string,
  apiKey: string,
  languageCode: string,
  pcmChunks: Buffer[],
): Promise<{ transcriptText: string; latencyMs: number }> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let settled = false;
    let sessionCreatedTimer: ReturnType<typeof setTimeout> | null = null;
    let committedTimer: ReturnType<typeof setTimeout> | null = null;

    // NOT YET VERIFIED: the supplied docs list sample_rate, bit_rate,
    // num_channels, and use_language_asr_input as "streaming connection
    // parameters" but do not show the exact init message/query-string
    // schema. Passing them as query parameters on the WS URL is the
    // most common pattern for this kind of streaming STT API and is
    // used here as the best-effort mapping — this is the single spot
    // to change if a live connection rejects it.
    const qs = new URLSearchParams({
      sample_rate: "16000",
      bit_rate: "16",
      num_channels: "1",
      use_language_asr_input: languageCode,
    });
    const fullUrl = `${wsUrl}?${qs.toString()}`;

    const socket = new WebSocket(fullUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    function cleanup() {
      if (sessionCreatedTimer) clearTimeout(sessionCreatedTimer);
      if (committedTimer) clearTimeout(committedTimer);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }

    function fail(err: SpeechProviderError) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    }

    function succeed(transcriptText: string) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ transcriptText, latencyMs: Date.now() - started });
    }

    function sendAudioChunksThenCommit() {
      let ackId = 1;
      for (const chunk of pcmChunks) {
        socket.send(
          JSON.stringify({
            message_type: "INPUT_AUDIO_CHUNK",
            audio_base_64: chunk.toString("base64"),
            ack_id: ackId++,
          }),
        );
      }
      socket.send(JSON.stringify({ message_type: "COMMIT" }));
      committedTimer = setTimeout(() => {
        fail(
          new SpeechProviderError(
            "sahara",
            "TIMEOUT",
            `No COMMITTED_TRANSCRIPT received within ${COMMITTED_TRANSCRIPT_TIMEOUT_MS}ms of COMMIT.`,
          ),
        );
      }, COMMITTED_TRANSCRIPT_TIMEOUT_MS);
    }

    socket.on("open", () => {
      // NOT YET VERIFIED: whether the server requires waiting for
      // SESSION_CREATED before the first INPUT_AUDIO_CHUNK, or accepts
      // audio immediately on open. We wait, since SESSION_CREATED is
      // documented as a response message_type, implying a handshake.
      sessionCreatedTimer = setTimeout(() => {
        fail(
          new SpeechProviderError(
            "sahara",
            "TIMEOUT",
            `No SESSION_CREATED received within ${SESSION_CREATED_TIMEOUT_MS}ms of connecting.`,
          ),
        );
      }, SESSION_CREATED_TIMEOUT_MS);
    });

    socket.on("message", (data) => {
      let parsed: SaharaMessage;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        fail(new SpeechProviderError("sahara", "MALFORMED_RESPONSE", "Received non-JSON message from Sahara."));
        return;
      }

      switch (parsed.message_type) {
        case "SESSION_CREATED":
          if (sessionCreatedTimer) clearTimeout(sessionCreatedTimer);
          sendAudioChunksThenCommit();
          return;
        case "PARTIAL_TRANSCRIPT":
          // Tracked for potential future streaming UI use; the
          // synchronous SpeechProvider.transcribe() contract only
          // needs the final COMMITTED_TRANSCRIPT.
          return;
        case "COMMITTED_TRANSCRIPT": {
          const msg = parsed as Extract<SaharaMessage, { message_type: "COMMITTED_TRANSCRIPT" }>;
          if (typeof msg.transcript_text !== "string") {
            fail(
              new SpeechProviderError(
                "sahara",
                "MALFORMED_RESPONSE",
                "COMMITTED_TRANSCRIPT message did not contain a string transcript_text.",
              ),
            );
            return;
          }
          succeed(msg.transcript_text);
          return;
        }
        case "AUTHENTICATION_ERROR":
          fail(new SpeechProviderError("sahara", "AUTHENTICATION_ERROR", "Sahara rejected the API key."));
          return;
        case "QUOTA_EXCEEDED":
          fail(new SpeechProviderError("sahara", "QUOTA_EXCEEDED", "Sahara quota exceeded."));
          return;
        case "RESOURCE_EXHAUSTED":
          fail(new SpeechProviderError("sahara", "RESOURCE_EXHAUSTED", "Sahara resources exhausted (capacity)."));
          return;
        case "CHUNK_SIZE_TOO_SMALL":
        case "CHUNK_SIZE_TOO_LARGE":
          fail(new SpeechProviderError("sahara", "CHUNK_SIZE_ERROR", `Sahara rejected chunk size: ${parsed.message_type}.`));
          return;
        case "INSUFFICIENT_AUDIO_ACTIVITY":
          fail(new SpeechProviderError("sahara", "INSUFFICIENT_AUDIO_ACTIVITY", "Sahara detected insufficient audio activity (likely silence)."));
          return;
        case "SESSION_TIME_LIMIT_EXCEEDED":
          fail(new SpeechProviderError("sahara", "SESSION_TIME_LIMIT_EXCEEDED", "Sahara session time limit exceeded."));
          return;
        case "ERROR":
        case "INPUT_ERROR": {
          const msg = parsed as Extract<SaharaMessage, { message_type: "ERROR" | "INPUT_ERROR" }>;
          fail(
            new SpeechProviderError(
              "sahara",
              "MALFORMED_RESPONSE",
              msg.error || msg.message || `Sahara reported ${parsed.message_type}.`,
            ),
          );
          return;
        }
        default:
          // Unknown message_type: ignore rather than fail the whole
          // session over a message we don't recognize yet.
          return;
      }
    });

    socket.on("error", (err) => {
      fail(new SpeechProviderError("sahara", "NETWORK_ERROR", `Sahara WebSocket error: ${err.message}`));
    });

    socket.on("close", (code, reason) => {
      if (!settled) {
        fail(
          new SpeechProviderError(
            "sahara",
            "NETWORK_ERROR",
            `Sahara connection closed before a transcript was received (code ${code}${reason ? `, ${reason.toString()}` : ""}).`,
          ),
        );
      }
    });
  });
}

export const saharaProvider: SpeechProvider = {
  name: "sahara",
  get isLive(): boolean {
    return Boolean(process.env.SAHARA_API_KEY);
  },
  supportedLanguagePairs: SAHARA_SUPPORTED_LANGUAGE_PAIRS,

  async transcribe(input: AudioInput): Promise<SpeechResult> {
    // Development/benchmark escape hatch — see AudioInput.devTranscriptOverride.
    if (input.devTranscriptOverride !== undefined) {
      return {
        transcript: input.devTranscriptOverride,
        confidence: null,
        languagePair: input.languagePair,
        latencyMs: 0,
        providerName: "sahara (dev override — NOT a live Sahara response)",
      };
    }

    const { wsUrl, apiKey } = assertConfigured(); // throws REQUIRES_API_ACCESS if unset

    if (!SAHARA_SUPPORTED_LANGUAGE_PAIRS.includes(input.languagePair)) {
      throw new SpeechProviderError(
        "sahara",
        "UNSUPPORTED_LANGUAGE",
        `Sahara has not been verified to support ${input.languagePair}.`,
      );
    }
    if (!input.audioBytes || input.audioBytes.byteLength === 0) {
      throw new SpeechProviderError("sahara", "EMPTY_AUDIO", "No audio provided.");
    }

    let pcm: Buffer;
    try {
      pcm = await convertToPcm16Mono16k(Buffer.from(input.audioBytes));
    } catch (err) {
      const detail = err instanceof AudioConversionError ? err.stderr : (err as Error).message;
      throw new SpeechProviderError(
        "sahara",
        "AUDIO_CONVERSION_FAILED",
        `Failed to convert audio to PCM16/16kHz/mono for Sahara: ${detail}`,
      );
    }
    if (pcm.length === 0) {
      throw new SpeechProviderError("sahara", "EMPTY_AUDIO", "Audio conversion produced no PCM samples.");
    }

    const languageCode = LANGUAGE_CODE_MAP[input.languagePair];
    const pcmChunks = chunkPcm16(pcm);

    const { transcriptText, latencyMs } = await runSaharaSession(wsUrl, apiKey, languageCode, pcmChunks);

    return {
      transcript: transcriptText,
      confidence: null, // Sahara's documented COMMITTED_TRANSCRIPT payload has no confidence field
      languagePair: input.languagePair,
      latencyMs,
      providerName: "sahara",
    };
  },

  /**
   * Real connectivity/authentication check: opens an actual session
   * with ~0.5s of silence and looks for SESSION_CREATED vs.
   * AUTHENTICATION_ERROR vs. a network failure. Reports "authenticated"
   * ONLY if the server genuinely accepted the connection — never
   * inferred from configuration alone.
   */
  async checkHealth(): Promise<ProviderHealthResult> {
    const checkedAt = new Date().toISOString();
    const apiKey = process.env.SAHARA_API_KEY;
    if (!apiKey) {
      return { state: "not_configured", message: "SAHARA_API_KEY is not set.", checkedAt, latencyMs: null };
    }
    const wsUrl = process.env.SAHARA_WS_URL || DEFAULT_WS_URL;
    const started = Date.now();
    const silence = Buffer.alloc(16000, 0);

    return new Promise((resolve) => {
      let settled = false;
      const qs = new URLSearchParams({
        sample_rate: "16000",
        bit_rate: "16",
        num_channels: "1",
        use_language_asr_input: "en",
      });
      const fullUrl = `${wsUrl}?${qs.toString()}`;

      let socket: WebSocket;
      try {
        socket = new WebSocket(fullUrl, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch (err) {
        return resolve({
          state: "unreachable",
          message: `Failed to initialize WebSocket: ${(err as Error).message}`,
          checkedAt,
          latencyMs: Date.now() - started,
        });
      }

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.close();
        resolve({
          state: "unreachable",
          message: "Timeout waiting for Sahara response.",
          checkedAt,
          latencyMs: Date.now() - started,
        });
      }, 10_000);

      socket.on("message", (data) => {
        if (settled) return;
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.message_type === "SESSION_CREATED") {
            settled = true;
            clearTimeout(timer);
            const chunks = chunkPcm16(silence);
            for (let i = 0; i < chunks.length; i++) {
              socket.send(
                JSON.stringify({
                  message_type: "INPUT_AUDIO_CHUNK",
                  audio_base_64: chunks[i].toString("base64"),
                  ack_id: i + 1,
                }),
              );
            }
            socket.close();
            resolve({
              state: "authenticated",
              message: `Sahara authenticated successfully (session_id: ${parsed.session_id}, credit_balance: ${parsed.credit_balance}).`,
              checkedAt,
              latencyMs: Date.now() - started,
            });
          } else if (parsed.message_type === "AUTHENTICATION_ERROR") {
            settled = true;
            clearTimeout(timer);
            socket.close();
            resolve({
              state: "auth_failed",
              message: "Sahara rejected the API key (AUTHENTICATION_ERROR).",
              checkedAt,
              latencyMs: Date.now() - started,
            });
          } else if (parsed.message_type === "QUOTA_EXCEEDED") {
            settled = true;
            clearTimeout(timer);
            socket.close();
            resolve({
              state: "quota_exceeded",
              message: "Sahara reports quota exceeded for this key.",
              checkedAt,
              latencyMs: Date.now() - started,
            });
          }
        } catch {
          // ignore non-json
        }
      });

      socket.on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          state: "unreachable",
          message: `Sahara WebSocket error: ${err.message}`,
          checkedAt,
          latencyMs: Date.now() - started,
        });
      });

      socket.on("close", (code, reason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          state: "unreachable",
          message: `Sahara connection closed prematurely (code ${code}${reason ? `: ${reason.toString()}` : ""}).`,
          checkedAt,
          latencyMs: Date.now() - started,
        });
      });
    });
  },
};
