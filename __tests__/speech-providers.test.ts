import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { saharaProvider } from "@/lib/speech/providers/sahara";
import { whisperProvider } from "@/lib/speech/providers/whisper";
import { geminiProvider } from "@/lib/speech/providers/gemini";
import { modelBProvider } from "@/lib/speech/providers/model-b";
import { SpeechProviderError } from "@/lib/speech/types";

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
  });

  it("checkHealth reports not_configured with no API key", async () => {
    const health = await saharaProvider.checkHealth!();
    expect(health.state).toBe("not_configured");
  });
});

describe("whisperProvider", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.WHISPER_API_KEY;
  });

  afterEach(() => {
    if (originalKey) process.env.OPENAI_API_KEY = originalKey;
  });

  it("reports isLive=false when no OpenAI key is set", () => {
    expect(whisperProvider.isLive).toBe(false);
  });

  it("throws REQUIRES_API_ACCESS without API key", async () => {
    await expect(
      whisperProvider.transcribe({
        audioBytes: new ArrayBuffer(10),
        mimeType: "audio/wav",
        languagePair: "en",
      }),
    ).rejects.toMatchObject({ code: "REQUIRES_API_ACCESS" });
  });

  it("checkHealth reports not_configured without key", async () => {
    const health = await whisperProvider.checkHealth!();
    expect(health.state).toBe("not_configured");
  });
});

describe("geminiProvider", () => {
  const originalKey = process.env.GOOGLE_API_KEY;

  beforeEach(() => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalKey) process.env.GOOGLE_API_KEY = originalKey;
  });

  it("reports isLive=false when no Google API key is set", () => {
    expect(geminiProvider.isLive).toBe(false);
  });

  it("throws REQUIRES_API_ACCESS without API key", async () => {
    await expect(
      geminiProvider.transcribe({
        audioBytes: new ArrayBuffer(10),
        mimeType: "audio/wav",
        languagePair: "en-pcm",
      }),
    ).rejects.toMatchObject({ code: "REQUIRES_API_ACCESS" });
  });

  it("checkHealth reports not_configured without key", async () => {
    const health = await geminiProvider.checkHealth!();
    expect(health.state).toBe("not_configured");
  });
});

describe("modelBProvider", () => {
  it("throws REQUIRES_API_ACCESS with no credentials configured", async () => {
    await expect(
      modelBProvider.transcribe({
        audioBytes: new ArrayBuffer(10),
        mimeType: "audio/webm",
        languagePair: "en",
      }),
    ).rejects.toMatchObject({ code: "REQUIRES_API_ACCESS" });
  });
});
