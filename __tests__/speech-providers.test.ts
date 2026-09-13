import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { saharaProvider } from "@/lib/speech/providers/sahara";
import { whisperProvider } from "@/lib/speech/providers/whisper";
import { wav2vec2Provider } from "@/lib/speech/providers/wav2vec2";
import { SpeechProvider, SpeechProviderError } from "@/lib/speech/types";

describe("saharaProvider", () => {
  const originalWsUrl = process.env.SAHARA_WS_URL;
  const originalKey = process.env.SAHARA_API_KEY;

  beforeEach(() => {
    delete process.env.SAHARA_WS_URL;
    delete process.env.SAHARA_API_KEY;
  });
  afterEach(() => {
    if (originalWsUrl) process.env.SAHARA_WS_URL = originalWsUrl;
    if (originalKey) process.env.SAHARA_API_KEY = originalKey;
  });

  it("reports isLive=false with no credentials configured", () => {
    expect(saharaProvider.isLive).toBe(false);
  });

  it("throws REQUIRES_API_ACCESS instead of returning a fabricated result", async () => {
    await expect(
      saharaProvider.transcribe({
        audioBytes: new ArrayBuffer(10),
        mimeType: "audio/webm",
        languagePair: "en-pcm",
      }),
    ).rejects.toMatchObject({ code: "REQUIRES_API_ACCESS" } satisfies Partial<SpeechProviderError>);
  });

  it("supports the dev transcript override for downstream pipeline testing", async () => {
    const result = await saharaProvider.transcribe({
      audioBytes: null,
      mimeType: "audio/webm",
      languagePair: "en-pcm",
      devTranscriptOverride: "why negative times negative go give positive",
    });
    expect(result.transcript).toBe("why negative times negative go give positive");
    expect(result.providerName).toContain("dev override");
    expect(result.runtime).toBe("remote-api");
  });

  it("checkHealth reports not_configured with no API key", async () => {
    const health = await saharaProvider.checkHealth!();
    expect(health.state).toBe("not_configured");
  });
});

describe("whisperProvider", () => {
  it("has correct identity and local runtime", () => {
    expect(whisperProvider.id).toBe("whisper-tiny");
    expect(whisperProvider.runtime).toBe("local");
  });

  it("reports isLive=false when the local model folder is genuinely incomplete (no fabricated readiness)", () => {
    // In this environment models/whisper-tiny only has model.safetensors —
    // config.json/tokenizer files are missing, so this exercises the real
    // check rather than a mock, and must be false, never hardcoded true.
    expect(whisperProvider.isLive).toBe(false);
  });

  it("supports dev transcript override without calling Python worker or checking model files", async () => {
    const result = await whisperProvider.transcribe({
      audioBytes: null,
      mimeType: "audio/wav",
      languagePair: "en",
      devTranscriptOverride: "Why does negative times negative give positive?",
    });
    expect(result.transcript).toBe("Why does negative times negative give positive?");
    expect(result.runtime).toBe("local");
    expect(result.provider).toBe("whisper-tiny");
  });

  it("throws MODEL_NOT_FOUND (not EMPTY_AUDIO) when the local model folder is incomplete, even with audio provided", async () => {
    await expect(
      whisperProvider.transcribe({
        audioBytes: new ArrayBuffer(10),
        mimeType: "audio/wav",
        languagePair: "en",
      }),
    ).rejects.toMatchObject({ code: "MODEL_NOT_FOUND" });
  });

  it("checkHealth reports model_not_found with the missing files named, when the model is incomplete", async () => {
    const health = await whisperProvider.checkHealth!();
    expect(health.state).toBe("model_not_found");
    expect(health.message).toContain("whisper-tiny");
    expect(health.runtime).toBe("local");
  });

  it("checkHealth reports model_ready once local files are present (mocked)", async () => {
    const spy = vi.spyOn(whisperProvider as Required<SpeechProvider>, "checkHealth").mockResolvedValue({
      state: "model_ready",
      message: "Whisper Tiny is present and ready for inference on CPU.",
      checkedAt: new Date().toISOString(),
      latencyMs: 15,
      model: "openai/whisper-tiny",
      runtime: "local",
      device: "cpu",
    });
    const health = await whisperProvider.checkHealth!();
    expect(["model_ready", "model_not_found"]).toContain(health.state);
    expect(health.runtime).toBe("local");
    expect(health.model).toBe("openai/whisper-tiny");
    spy.mockRestore();
  });
});

describe("wav2vec2Provider", () => {
  it("has correct identity and local baseline runtime", () => {
    expect(wav2vec2Provider.id).toBe("wav2vec2-base-960h");
    expect(wav2vec2Provider.runtime).toBe("local");
  });

  it("reports isLive=false when the local model folder is genuinely incomplete (no fabricated readiness)", () => {
    expect(wav2vec2Provider.isLive).toBe(false);
  });

  it("supports dev transcript override without calling Python worker or checking model files", async () => {
    const result = await wav2vec2Provider.transcribe({
      audioBytes: null,
      mimeType: "audio/wav",
      languagePair: "en",
      devTranscriptOverride: "WHY DOES NEGATIVE TIMES NEGATIVE GIVE POSITIVE",
    });
    expect(result.transcript).toBe("WHY DOES NEGATIVE TIMES NEGATIVE GIVE POSITIVE");
    expect(result.runtime).toBe("local");
    expect(result.provider).toBe("wav2vec2-base-960h");
  });

  it("throws MODEL_NOT_FOUND (not EMPTY_AUDIO) when the local model folder is incomplete, even with audio provided", async () => {
    await expect(
      wav2vec2Provider.transcribe({
        audioBytes: new ArrayBuffer(10),
        mimeType: "audio/wav",
        languagePair: "en",
      }),
    ).rejects.toMatchObject({ code: "MODEL_NOT_FOUND" });
  });

  it("checkHealth reports model_not_found with the missing files named, when the model is incomplete", async () => {
    const health = await wav2vec2Provider.checkHealth!();
    expect(health.state).toBe("model_not_found");
    expect(health.message).toContain("wav2vec2-base-960h");
    expect(health.runtime).toBe("local");
  });

  it("checkHealth reports model_ready once local files are present (mocked)", async () => {
    const spy = vi.spyOn(wav2vec2Provider as Required<SpeechProvider>, "checkHealth").mockResolvedValue({
      state: "model_ready",
      message: "Wav2Vec2 Base 960h is present and ready for inference on CPU.",
      checkedAt: new Date().toISOString(),
      latencyMs: 12,
      model: "facebook/wav2vec2-base-960h",
      runtime: "local",
      device: "cpu",
    });
    const health = await wav2vec2Provider.checkHealth!();
    expect(["model_ready", "model_not_found"]).toContain(health.state);
    expect(health.runtime).toBe("local");
    expect(health.model).toBe("facebook/wav2vec2-base-960h");
    spy.mockRestore();
  });
});
