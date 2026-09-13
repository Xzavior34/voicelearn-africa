import { NextRequest, NextResponse } from "next/server";
import { speechProviders, PRIMARY_PROVIDER } from "@/lib/speech/registry";
import { SpeechProviderError, LanguagePair } from "@/lib/speech/types";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB cap
const ALLOWED_MIME_PREFIXES = ["audio/"];
const ALLOWED_LANGUAGE_PAIRS: LanguagePair[] = ["en", "en-pcm", "en-yo"];

/**
 * Server-side speech route. This is the ONLY place Sahara (or any
 * comparison provider) credentials are used — the browser never sees
 * SAHARA_API_KEY. Client requests are treated as untrusted: audio size
 * and MIME type are validated, and `devTranscriptOverride` is always
 * stripped so a learner's request can never bypass the real pipeline.
 */
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const audio = formData.get("audio");
  const languagePairRaw = formData.get("languagePair");

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio field." }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: "Empty audio recording." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio file too large (max 10MB)." }, { status: 413 });
  }
  if (!ALLOWED_MIME_PREFIXES.some((prefix) => audio.type.startsWith(prefix))) {
    return NextResponse.json({ error: "Unsupported audio MIME type." }, { status: 415 });
  }

  const languagePair = ALLOWED_LANGUAGE_PAIRS.includes(languagePairRaw as LanguagePair)
    ? (languagePairRaw as LanguagePair)
    : "en-pcm";

  const provider = speechProviders[PRIMARY_PROVIDER];
  const audioBytes = await audio.arrayBuffer();

  try {
    const result = await provider.transcribe({
      audioBytes,
      mimeType: audio.type,
      languagePair,
      // devTranscriptOverride is intentionally never read from the
      // request — untrusted client input cannot set it.
    });
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof SpeechProviderError) {
      const status = mapErrorCodeToStatus(err.code);
      return NextResponse.json(
        { error: err.message, code: err.code, provider: err.providerName },
        { status },
      );
    }
    return NextResponse.json({ error: "Unexpected speech processing error." }, { status: 500 });
  }
}

/**
 * Maps every documented Sahara/provider failure mode to an appropriate
 * HTTP status so the client can distinguish "not configured" from
 * "bad input" from "rate limited" from "try again later" — see
 * RESPONSIBLE_AI.md "Failure handling".
 */
function mapErrorCodeToStatus(code: SpeechProviderError["code"]): number {
  switch (code) {
    case "REQUIRES_API_ACCESS":
      return 503;
    case "AUTHENTICATION_ERROR":
      return 401;
    case "QUOTA_EXCEEDED":
      return 429;
    case "RESOURCE_EXHAUSTED":
      return 503;
    case "SESSION_TIME_LIMIT_EXCEEDED":
      return 408;
    case "CHUNK_SIZE_ERROR":
    case "UNSUPPORTED_LANGUAGE":
    case "EMPTY_AUDIO":
    case "INSUFFICIENT_AUDIO_ACTIVITY":
      return 422;
    case "AUDIO_CONVERSION_FAILED":
    case "MALFORMED_RESPONSE":
      return 422;
    case "NETWORK_ERROR":
    case "TIMEOUT":
      return 504;
    default:
      return 500;
  }
}
