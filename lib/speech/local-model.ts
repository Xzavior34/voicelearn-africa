/**
 * Shared local-model-folder verification.
 *
 * Both local ASR providers (Whisper Tiny, Wav2Vec2 Base 960h) load
 * weights exclusively from a filesystem path — never from a Hugging
 * Face Hub ID at runtime. This module is the single place that
 * decides whether a given local model folder is actually usable, so
 * "isLive", "checkHealth", and "transcribe" all agree on the same
 * definition of "present" and report the same missing pieces.
 */
import fs from "fs";
import path from "path";

export interface LocalModelRequirement {
  /** Human-readable model name, used in error/report messages. */
  displayName: string;
  /** Hugging Face repo id, used only as a label — never fetched over the network. */
  repoId: string;
  /** Resolved local directory the weights must live in. */
  localDir: string;
  /** Files that must ALL be present (config + tokenizer/preprocessor metadata). */
  requiredFiles: string[];
  /** At least ONE of these weight files must be present. */
  weightFileCandidates: string[];
}

export interface LocalModelCheck {
  available: boolean;
  localDir: string;
  directoryExists: boolean;
  missingRequiredFiles: string[];
  weightFileFound: string | null;
  missingWeightFile: boolean;
}

export function checkLocalModel(req: LocalModelRequirement): LocalModelCheck {
  const directoryExists = fs.existsSync(req.localDir) && fs.statSync(req.localDir).isDirectory();

  if (!directoryExists) {
    return {
      available: false,
      localDir: req.localDir,
      directoryExists: false,
      missingRequiredFiles: req.requiredFiles,
      weightFileFound: null,
      missingWeightFile: true,
    };
  }

  const missingRequiredFiles = req.requiredFiles.filter(
    (file) => !fs.existsSync(path.join(req.localDir, file)),
  );
  const weightFileFound = req.weightFileCandidates.find((file) =>
    fs.existsSync(path.join(req.localDir, file)),
  ) ?? null;

  return {
    available: missingRequiredFiles.length === 0 && weightFileFound !== null,
    localDir: req.localDir,
    directoryExists: true,
    missingRequiredFiles,
    weightFileFound,
    missingWeightFile: weightFileFound === null,
  };
}

/** Human-readable diagnostic for MODEL_NOT_FOUND errors and health messages. */
export function describeLocalModelProblem(req: LocalModelRequirement, check: LocalModelCheck): string {
  if (!check.directoryExists) {
    return (
      `Local model directory not found: ${req.localDir}\n` +
      `Download ${req.repoId} and place its files at that exact path. See LOCAL_MODEL_SETUP.md.`
    );
  }
  const problems: string[] = [];
  if (check.missingRequiredFiles.length > 0) {
    problems.push(`missing required file(s): ${check.missingRequiredFiles.join(", ")}`);
  }
  if (check.missingWeightFile) {
    problems.push(`missing a weights file (expected one of: ${req.weightFileCandidates.join(", ")})`);
  }
  return (
    `Local model directory ${req.localDir} is incomplete — ${problems.join("; ")}. ` +
    `See LOCAL_MODEL_SETUP.md for the exact file list.`
  );
}
