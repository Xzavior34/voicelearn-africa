/**
 * OpenAI Whisper Base speech provider — LOCAL, FILESYSTEM-ONLY INFERENCE.
 *
 * Source: openai/whisper-base (Hugging Face / Transformers)
 * License: Apache-2.0 (per the Hugging Face Hub repo's license tag)
 *
 * ZERO PAID API DEPENDENCIES. ZERO NETWORK ACCESS AT INFERENCE TIME.
 * Same architecture family and required-file shape as Whisper Tiny — see
 * ./whisper-factory.ts for the shared loading/inference logic, and
 * LOCAL_MODEL_SETUP.md for exactly what to download and where to put it.
 *
 * Model files are NOT included with this repository and are not
 * currently downloaded in this environment — see LOCAL_MODEL_SETUP.md.
 */
import { createWhisperProvider } from "./whisper-factory";
import { WHISPER_BASE_REQUIRED_FILES } from "../model-requirements";

export const whisperBaseProvider = createWhisperProvider({
  providerId: "whisper-base",
  displayName: "OpenAI Whisper Base (Local, Filesystem-Only)",
  defaultRepoId: "openai/whisper-base",
  repoIdEnvVar: "WHISPER_BASE_MODEL_ID",
  localPathEnvVar: "WHISPER_BASE_LOCAL_MODEL_PATH",
  defaultLocalDirName: "whisper-base",
  requiredFiles: WHISPER_BASE_REQUIRED_FILES,
});
