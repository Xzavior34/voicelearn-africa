import { SpeechProvider } from "./types";
import { saharaProvider } from "./providers/sahara";
import { modelBProvider } from "./providers/model-b";
import { modelCProvider } from "./providers/model-c";

/**
 * Central provider registry. Sahara is the PRIMARY provider for the
 * live product (app/api/speech). Model B and Model C exist only for
 * the benchmark comparison (lib/benchmark) — the tutoring product
 * itself never calls them.
 */
export const speechProviders: Record<string, SpeechProvider> = {
  sahara: saharaProvider,
  "model-b": modelBProvider,
  "model-c": modelCProvider,
};

export const PRIMARY_PROVIDER = "sahara";
