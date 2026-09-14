/**
 * Shared factory for Whisper-family local providers. Whisper Tiny and
 * Whisper Base share identical loading/inference code (same
 * `scripts/asr/whisper_worker.py`, same required-file shape) — they only
 * differ in id, repo, default local directory, and env var names. This
 * factory exists so adding another Whisper checkpoint never means
 * copy-pasting 300 lines and risking the two copies drifting apart.
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
import { WEIGHT_FILE_CANDIDATES } from "../model-requirements";

const WHISPER_SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = ["en", "pcm", "en-pcm", "en-yo"];

export interface WhisperProviderConfig {
  /** e.g. "whisper-tiny" */
  providerId: string;
  /** e.g. "OpenAI Whisper Tiny (Local, Filesystem-Only)" */
  displayName: string;
  /** e.g. "openai/whisper-tiny" — default label, overridable via repoIdEnvVar */
  defaultRepoId: string;
  /** e.g. "WHISPER_MODEL_ID" */
  repoIdEnvVar: string;
  /** e.g. "WHISPER_LOCAL_MODEL_PATH" */
  localPathEnvVar: string;
  /** e.g. "whisper-tiny" — default folder name under models/ */
  defaultLocalDirName: string;
  requiredFiles: string[];
}

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
  providerId: string,
  scriptName: string,
  args: string[],
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
      reject(new SpeechProviderError(providerId, "TIMEOUT", `Whisper worker timed out after ${timeoutMs}ms`));
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
      // A failed spawn (e.g. no Python interpreter / wrong architecture,
      // such as Android/Termux without a usable PyTorch build) is a
      // runtime-availability problem, not a model or audio problem —
      // callers map this to BLOCKED_RUNTIME, not FAILED.
      reject(
        new SpeechProviderError(
          providerId,
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
  });
}

export function createWhisperProvider(config: WhisperProviderConfig): SpeechProvider {
  const { providerId, displayName, requiredFiles } = config;
  const repoId = process.env[config.repoIdEnvVar] || config.defaultRepoId;
  const localModelDir = path.resolve(
    /*turbopackIgnore: true*/ process.env[config.localPathEnvVar] ||
      path.join(process.cwd(), "models", config.defaultLocalDirName),
  );

  const modelRequirement: LocalModelRequirement = {
    displayName,
    repoId,
    localDir: localModelDir,
    requiredFiles,
    weightFileCandidates: WEIGHT_FILE_CANDIDATES,
  };

  return {
    id: providerId,
    name: displayName,
    model: repoId,
    runtime: "local",
    get isLive(): boolean {
      return checkLocalModel(modelRequirement).available;
    },
    supportedLanguagePairs: WHISPER_SUPPORTED_LANGUAGE_PAIRS,

    async transcribe(input: AudioInput): Promise<SpeechResult> {
      if (input.devTranscriptOverride !== undefined) {
        return {
          provider: providerId,
          providerName: `${providerId} (dev-override)`,
          model: repoId,
          runtime: "local",
          transcript: input.devTranscriptOverride,
          confidence: null,
          languagePair: input.languagePair,
          latencyMs: 0,
          success: true,
        };
      }

      const check = checkLocalModel(modelRequirement);
      if (!check.available) {
        throw new SpeechProviderError(providerId, "MODEL_NOT_FOUND", describeLocalModelProblem(modelRequirement, check));
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
          tempAudioPath = path.join(tmpDir, `${providerId}_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);
          fs.writeFileSync(tempAudioPath, buffer);
          createdTempFile = true;
        }
      } else if (tempAudioPath && fs.existsSync(/*turbopackIgnore: true*/ tempAudioPath)) {
        const buf = fs.readFileSync(/*turbopackIgnore: true*/ tempAudioPath);
        audioSha256 = crypto.createHash("sha256").update(buf).digest("hex");
      } else {
        throw new SpeechProviderError(providerId, "EMPTY_AUDIO", "No audio bytes or valid audio path provided.");
      }

      try {
        const { stdout, stderr, exitCode } = await runPythonWorker(
          providerId,
          "whisper_worker.py",
          ["--audio", tempAudioPath, "--model", localModelDir, "--repo-id", repoId],
          180_000,
        );

        if (exitCode !== 0 && !stdout.trim()) {
          throw new SpeechProviderError(
            providerId,
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
            providerId,
            "MALFORMED_RESPONSE",
            `Failed to parse Whisper worker JSON output: ${stdout || (err as Error).message}`,
          );
        }

        if (!parsed.success) {
          const code = parsed.errorCode === "MODEL_NOT_FOUND" ? "MODEL_NOT_FOUND" : "LOCAL_WORKER_ERROR";
          throw new SpeechProviderError(providerId, code, parsed.error || "Whisper local transcription failed.");
        }

        return {
          provider: providerId,
          providerName: providerId,
          model: parsed.model || repoId,
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

      const localCheck = checkLocalModel(modelRequirement);
      if (!localCheck.available) {
        return {
          state: "model_not_found",
          message: describeLocalModelProblem(modelRequirement, localCheck),
          checkedAt,
          latencyMs: Date.now() - started,
          model: repoId,
          runtime: "local",
        };
      }

      try {
        const { stdout, exitCode } = await runPythonWorker(
          providerId,
          "whisper_worker.py",
          ["--health", "--model", localModelDir, "--repo-id", repoId],
          30_000,
        );
        if (exitCode !== 0) {
          return {
            state: "unreachable",
            message: "Failed to run Whisper local health check.",
            checkedAt,
            latencyMs: Date.now() - started,
            model: repoId,
            runtime: "local",
          };
        }

        const parsed = JSON.parse(stdout.trim());
        const state = parsed.status === "READY" ? "model_ready" : "model_not_found";
        const message =
          parsed.status === "READY"
            ? `${displayName} is present at ${localModelDir} and ready for inference on ${parsed.deviceName || parsed.device}.`
            : describeLocalModelProblem(modelRequirement, localCheck);

        return {
          state,
          message,
          checkedAt,
          latencyMs: Date.now() - started,
          model: parsed.model || repoId,
          runtime: "local",
          device: parsed.device,
        };
      } catch (err) {
        return {
          state: "unknown_error",
          message: `Local Whisper check error: ${(err as Error).message}`,
          checkedAt,
          latencyMs: Date.now() - started,
          model: repoId,
          runtime: "local",
        };
      }
    },
  };
}
