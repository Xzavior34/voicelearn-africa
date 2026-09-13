/**
 * Model C — second comparison ASR model, ideally one with some
 * multilingual/code-switch capability, to give a three-way spread
 * between "no code-switch awareness", "some", and Sahara ("built for
 * African code-switching").
 *
 * STATUS: REQUIRES_API_ACCESS
 *
 * Point MODEL_C_API_URL / MODEL_C_API_KEY at any real ASR REST endpoint
 * to make this live. Same contract as Model B.
 */
import { createGenericRestProvider } from "./generic-rest-provider";

export const modelCProvider = createGenericRestProvider({
  name: "model-c",
  urlEnvVar: "MODEL_C_API_URL",
  keyEnvVar: "MODEL_C_API_KEY",
  supportedLanguagePairs: ["en", "en-pcm"],
});
