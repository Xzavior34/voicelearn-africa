/**
 * OpenAI Whisper Tiny speech provider — LOCAL, FILESYSTEM-ONLY INFERENCE.
 *
 * Source: openai/whisper-tiny (Hugging Face / Transformers)
 * License: Apache-2.0 (per the Hugging Face Hub repo's license tag)
 *
 * ZERO PAID API DEPENDENCIES. ZERO NETWORK ACCESS AT INFERENCE TIME.
 * Runs locally via Python Transformers inference worker
 * (`scripts/asr/whisper_worker.py`). Weights are loaded ONLY from the
 * local filesystem path below — never downloaded on demand, and never
 * silently resolved against a Hugging Face Hub ID. See
 * LOCAL_MODEL_SETUP.md for exactly what to download and where to put it.
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
import { checkLocalModel, describeLocalModelProblem, LocalModelRequirement } from "../local-model";
import { WHISPER_TINY_REQUIRED_FILES, WEIGHT_FILE_CANDIDATES } from "../model-requirements";

const PROVIDER_ID = "whisper-tiny";
const WHISPER_SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = ["en", "pcm", "en-pcm", "en-yo"];

// Label only — informational, never used to fetch anything over the network.
const REPO_ID = process.env.WHISPER_MODEL_ID || "openai/whisper-tiny";

const LOCAL_MODEL_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.WHISPER_LOCAL_MODEL_PATH || path.join(process.cwd(), "models", "whisper-tiny"),
);

const MODEL_REQUIREMENT: LocalModelRequirement = {
  displayName: "Whisper Tiny",
  repoId: REPO_ID,
  localDir: LOCAL_MODEL_DIR,
  requiredFiles: WHISPER_TINY_REQUIRED_FILES,
  weightFileCandidates: WEIGHT_FILE_CANDIDATES,
};

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

    const child = spawn(/*turbopackIgnore: true*/ pythonExe, [scriptPath, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      // HF_HUB_OFFLINE / TRANSFORMERS_OFFLINE force transformers to refuse
      // any network call and fail loudly instead of silently downloading.
      env: { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1" },
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
      reject(new SpeechProviderError(PROVIDER_ID, "TIMEOUT", `Whisper worker timed out after ${timeoutMs}ms`));
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
          PROVIDER_ID,
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

export const whisperProvider: SpeechProvider = {
  id: PROVIDER_ID,
  name: "OpenAI Whisper Tiny (Local, Filesystem-Only)",
  model: REPO_ID,
  runtime: "local",
  get isLive(): boolean {
    // Genuinely live only when the local model folder is complete —
    // never assumed, never based on the HF Hub cache.
    return checkLocalModel(MODEL_REQUIREMENT).available;
  },
  supportedLanguagePairs: WHISPER_SUPPORTED_LANGUAGE_PAIRS,

  async transcribe(input: AudioInput): Promise<SpeechResult> {
    // Development/benchmark escape hatch
    if (input.devTranscriptOverride !== undefined) {
      return {
        provider: PROVIDER_ID,
        providerName: `${PROVIDER_ID} (dev-override)`,
        model: REPO_ID,
        runtime: "local",
        transcript: input.devTranscriptOverride,
        confidence: null,
        languagePair: input.languagePair,
        latencyMs: 0,
        success: true,
      };
    }

    const check = checkLocalModel(MODEL_REQUIREMENT);
    if (!check.available) {
      throw new SpeechProviderError(PROVIDER_ID, "MODEL_NOT_FOUND", describeLocalModelProblem(MODEL_REQUIREMENT, check));
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
        tempAudioPath = path.join(tmpDir, `whisper_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);
        fs.writeFileSync(tempAudioPath, buffer);
        createdTempFile = true;
      }
    } else if (tempAudioPath && fs.existsSync(/*turbopackIgnore: true*/ tempAudioPath)) {
      const buf = fs.readFileSync(/*turbopackIgnore: true*/ tempAudioPath);
      audioSha256 = crypto.createHash("sha256").update(buf).digest("hex");
    } else {
      throw new SpeechProviderError(PROVIDER_ID, "EMPTY_AUDIO", "No audio bytes or valid audio path provided.");
    }

    try {
      const { stdout, stderr, exitCode } = await runPythonWorker(
        "whisper_worker.py",
        ["--audio", tempAudioPath, "--model", LOCAL_MODEL_DIR, "--repo-id", REPO_ID],
        undefined,
        180_000,
      );

      if (exitCode !== 0 && !stdout.trim()) {
        throw new SpeechProviderError(
          PROVIDER_ID,
          "LOCAL_WORKER_ERROR",
          `Whisper local worker exited with code ${exitCode}: ${stderr}`,
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
        errorCode?: string;
      };

      try {
        parsed = JSON.parse(stdout.trim());
      } catch (err) {
        throw new SpeechProviderError(
          PROVIDER_ID,
          "MALFORMED_RESPONSE",
          `Failed to parse Whisper worker JSON output: ${stdout || (err as Error).message}`,
        );
      }

      if (!parsed.success) {
        const code = parsed.errorCode === "MODEL_NOT_FOUND" ? "MODEL_NOT_FOUND" : "LOCAL_WORKER_ERROR";
        throw new SpeechProviderError(PROVIDER_ID, code, parsed.error || "Whisper local transcription failed.");
      }

      return {
        provider: PROVIDER_ID,
        providerName: PROVIDER_ID,
        model: parsed.model || REPO_ID,
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
          mode: "local-filesystem-only",
        },
      };
    } finally {
      if (createdTempFile && tempAudioPath && fs.existsSync(/*turbopackIgnore: true*/ tempAudioPath)) {
        try {
          fs.unlinkSync(/*turbopackIgnore: true*/ tempAudioPath);
        } catch {
          // ignore cleanup errors
        }
      }
    }
  },

  async checkHealth(): Promise<ProviderHealthResult> {
    const checkedAt = new Date().toISOString();
    const started = Date.now();

    const localCheck = checkLocalModel(MODEL_REQUIREMENT);
    if (!localCheck.available) {
      return {
        state: "model_not_found",
        message: describeLocalModelProblem(MODEL_REQUIREMENT, localCheck),
        checkedAt,
        latencyMs: Date.now() - started,
        model: REPO_ID,
        runtime: "local",
      };
    }

    try {
      const { stdout, exitCode } = await runPythonWorker(
        "whisper_worker.py",
        ["--health", "--model", LOCAL_MODEL_DIR, "--repo-id", REPO_ID],
        undefined,
        30_000,
      );
      if (exitCode !== 0) {
        return {
          state: "unreachable",
          message: "Failed to run Whisper local health check.",
          checkedAt,
          latencyMs: Date.now() - started,
          model: REPO_ID,
          runtime: "local",
        };
      }

      const parsed = JSON.parse(stdout.trim());
      const state = parsed.status === "READY" ? "model_ready" : "model_not_found";
      const message =
        parsed.status === "READY"
          ? `Whisper Tiny is present at ${LOCAL_MODEL_DIR} and ready for inference on ${parsed.deviceName || parsed.device}.`
          : describeLocalModelProblem(MODEL_REQUIREMENT, localCheck);

      return {
        state,
        message,
        checkedAt,
        latencyMs: Date.now() - started,
        model: parsed.model || REPO_ID,
        runtime: "local",
        device: parsed.device,
      };
    } catch (err) {
      return {
        state: "unknown_error",
        message: `Local Whisper check error: ${(err as Error).message}`,
        checkedAt,
        latencyMs: Date.now() - started,
        model: REPO_ID,
        runtime: "local",
      };
    }
  },
};
