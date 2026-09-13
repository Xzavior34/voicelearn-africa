/**
 * Meta Wav2Vec2 Large 960h speech provider — LOCAL OPEN-WEIGHT INFERENCE.
 *
 * Source: facebook/wav2vec2-large-960h (Hugging Face / Transformers)
 * License: Apache-2.0
 *
 * ZERO PAID API DEPENDENCIES.
 * Runs locally via Python Transformers inference worker (`scripts/asr/wav2vec2_worker.py`).
 *
 * RESEARCH BASELINE NOTE:
 * facebook/wav2vec2-large-960h is an English LibriSpeech model (~1.26 GB),
 * serving as an independent general English open-source ASR baseline to evaluate
 * how non-African specialized speech models degrade under African code-switching.
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  AudioInput,
  SpeechProvider,
  SpeechProviderError,
  SpeechResult,
  LanguagePair,
  ProviderHealthResult,
} from "../types";

const WAV2VEC2_SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = ["en", "pcm", "en-pcm", "en-yo"];
const DEFAULT_MODEL_ID = process.env.WAV2VEC2_MODEL_ID || "facebook/wav2vec2-large-960h";

function getPythonExecutable(): string {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  if (process.platform === "win32") {
    if (fs.existsSync("C:\\Python314\\python.exe")) return "C:\\Python314\\python.exe";
    if (fs.existsSync("C:\\Python312\\python.exe")) return "C:\\Python312\\python.exe";
  }
  return "python";
}

function runPythonWorker(
  scriptName: string,
  args: string[],
  stdinPayload?: Record<string, unknown>,
  timeoutMs: number = 120_000,
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const pythonExe = getPythonExecutable();
    const scriptPath = path.resolve(process.cwd(), "scripts", "asr", scriptName);

    const child = spawn(pythonExe, [scriptPath, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
      reject(new SpeechProviderError("wav2vec2-large-960h", "TIMEOUT", `Wav2Vec2 worker timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        new SpeechProviderError(
          "wav2vec2-large-960h",
          "LOCAL_WORKER_ERROR",
          `Failed to launch Python worker: ${err.message}. Ensure Python 3 with transformers and torch is installed.`,
        ),
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code });
    });

    if (stdinPayload) {
      child.stdin.write(JSON.stringify(stdinPayload));
      child.stdin.end();
    }
  });
}

export const wav2vec2Provider: SpeechProvider = {
  id: "wav2vec2-large-960h",
  name: "Meta Wav2Vec2 Large 960h (Local Baseline)",
  model: DEFAULT_MODEL_ID,
  runtime: "local",
  get isLive(): boolean {
    return true;
  },
  supportedLanguagePairs: WAV2VEC2_SUPPORTED_LANGUAGE_PAIRS,

  async transcribe(input: AudioInput): Promise<SpeechResult> {
    // Development/benchmark escape hatch
    if (input.devTranscriptOverride !== undefined) {
      return {
        provider: "wav2vec2-large-960h",
        providerName: "wav2vec2-large-960h (dev-override)",
        model: DEFAULT_MODEL_ID,
        runtime: "local",
        transcript: input.devTranscriptOverride,
        confidence: null,
        languagePair: input.languagePair,
        latencyMs: 0,
        success: true,
      };
    }

    let tempAudioPath = input.audioPath;
    let createdTempFile = false;
    let audioSha256: string | undefined;

    if (input.audioBytes && input.audioBytes.byteLength > 0) {
      const buffer = Buffer.from(input.audioBytes);
      audioSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
      if (!tempAudioPath) {
        const tmpDir = path.resolve(process.cwd(), ".tmp");
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        tempAudioPath = path.join(tmpDir, `w2v2_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);
        fs.writeFileSync(tempAudioPath, buffer);
        createdTempFile = true;
      }
    } else if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      const buf = fs.readFileSync(tempAudioPath);
      audioSha256 = crypto.createHash("sha256").update(buf).digest("hex");
    } else {
      throw new SpeechProviderError("wav2vec2-large-960h", "EMPTY_AUDIO", "No audio bytes or valid audio path provided.");
    }

    try {
      const { stdout, stderr, exitCode } = await runPythonWorker(
        "wav2vec2_worker.py",
        ["--audio", tempAudioPath, "--model", DEFAULT_MODEL_ID],
        undefined,
        180_000,
      );

      if (exitCode !== 0 && !stdout.trim()) {
        throw new SpeechProviderError(
          "wav2vec2-large-960h",
          "LOCAL_WORKER_ERROR",
          `Wav2Vec2 local worker exited with code ${exitCode}: ${stderr}`,
        );
      }

      let parsed: {
        success: boolean;
        transcript?: string;
        model?: string;
        latencyMs?: number;
        warmInferenceLatencyMs?: number;
        coldStartMs?: number;
        device?: string;
        deviceName?: string;
        error?: string;
      };

      try {
        parsed = JSON.parse(stdout.trim());
      } catch (err) {
        throw new SpeechProviderError(
          "wav2vec2-large-960h",
          "MALFORMED_RESPONSE",
          `Failed to parse Wav2Vec2 worker JSON output: ${stdout || (err as Error).message}`,
        );
      }

      if (!parsed.success) {
        throw new SpeechProviderError(
          "wav2vec2-large-960h",
          "LOCAL_WORKER_ERROR",
          parsed.error || "Wav2Vec2 local transcription failed.",
        );
      }

      return {
        provider: "wav2vec2-large-960h",
        providerName: "wav2vec2-large-960h",
        model: parsed.model || DEFAULT_MODEL_ID,
        runtime: "local",
        transcript: parsed.transcript || "",
        confidence: null,
        languagePair: input.languagePair,
        latencyMs: parsed.latencyMs || 0,
        success: true,
        metadata: {
          audioSha256,
          device: parsed.device,
          deviceName: parsed.deviceName,
          warmInferenceLatencyMs: parsed.warmInferenceLatencyMs,
          coldStartMs: parsed.coldStartMs,
          mode: "local-open-weight-baseline",
        },
      };
    } finally {
      if (createdTempFile && tempAudioPath && fs.existsSync(tempAudioPath)) {
        try {
          fs.unlinkSync(tempAudioPath);
        } catch {
          // ignore cleanup errors
        }
      }
    }
  },

  async checkHealth(): Promise<ProviderHealthResult> {
    const checkedAt = new Date().toISOString();
    const started = Date.now();
    try {
      const { stdout, exitCode } = await runPythonWorker("wav2vec2_worker.py", ["--health"], undefined, 30_000);
      if (exitCode !== 0) {
        return {
          state: "unreachable",
          message: "Failed to run Wav2Vec2 local health check.",
          checkedAt,
          latencyMs: Date.now() - started,
          model: DEFAULT_MODEL_ID,
          runtime: "local",
        };
      }

      const parsed = JSON.parse(stdout.trim());
      const state = parsed.status === "READY" ? "model_ready" : "model_download_required";
      const message =
        parsed.status === "READY"
          ? `Wav2Vec2 Large 960h is cached locally and ready for inference on ${parsed.deviceName || parsed.device}.`
          : `Wav2Vec2 Large 960h open weights (~1.26 GB) will download on first benchmark run. No API key required.`;

      return {
        state,
        message,
        checkedAt,
        latencyMs: Date.now() - started,
        model: parsed.model || DEFAULT_MODEL_ID,
        runtime: "local",
        device: parsed.device,
      };
    } catch (err) {
      return {
        state: "unknown_error",
        message: `Local Wav2Vec2 check error: ${(err as Error).message}`,
        checkedAt,
        latencyMs: Date.now() - started,
        model: DEFAULT_MODEL_ID,
        runtime: "local",
      };
    }
  },
};
