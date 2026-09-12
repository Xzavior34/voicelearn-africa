/**
 * Model B — general-purpose comparison ASR model (NOT code-switch aware).
 *
 * STATUS: REQUIRES_API_ACCESS
 *
 * Intended to represent a standard, widely-used speech-to-text model
 * (e.g. a hosted Whisper endpoint) that has NOT been tuned for African
 * code-switching. Point MODEL_B_API_URL / MODEL_B_API_KEY at any real
 * ASR REST endpoint that accepts multipart audio and returns
 * { transcript, confidence? } to make this live. We deliberately do not
 * name a specific vendor here since no credentials are available in
 * this environment — naming one without testing it would itself be an
 * unverified claim.
 */
import { createGenericRestProvider } from "./generic-rest-provider";

export const modelBProvider = createGenericRestProvider({
  name: "model-b",
  urlEnvVar: "MODEL_B_API_URL",
  keyEnvVar: "MODEL_B_API_KEY",
  supportedLanguagePairs: ["en"],
});
