/**
 * Single source of truth for which files each local model folder must
 * contain. Audited directly against the `from_pretrained()` / `pipeline()`
 * calls in scripts/asr/whisper_worker.py and scripts/asr/wav2vec2_worker.py
 * — see LOCAL_MODEL_SETUP.md Section 2 for the full per-file rationale.
 *
 * Kept intentionally minimal: a file only appears here if the worker
 * code actually fails without it. Files that are commonly shipped
 * alongside a model but aren't load-bearing for what this worker calls
 * (e.g. tokenizer.json, special_tokens_map.json, added_tokens.json) are
 * NOT required — they're harmless if present, but their absence must
 * never block a benchmark run.
 *
 * IMPORTANT: scripts/asr/whisper_worker.py and scripts/asr/wav2vec2_worker.py
 * run in a separate Python process and cannot import this file — their
 * REQUIRED_FILES / WEIGHT_FILE_CANDIDATES constants are hand-kept in sync
 * with the lists below. If you change one, change both.
 */

export const WHISPER_TINY_REQUIRED_FILES = [
  "config.json",
  "generation_config.json",
  "preprocessor_config.json",
  "tokenizer_config.json",
  "vocab.json",
  "merges.txt",
];

export const WAV2VEC2_BASE_REQUIRED_FILES = [
  "config.json",
  "preprocessor_config.json",
  "tokenizer_config.json",
  "vocab.json",
];

/** At least one of these must be present, for either model. Prefer safetensors. */
export const WEIGHT_FILE_CANDIDATES = ["model.safetensors", "pytorch_model.bin"];
