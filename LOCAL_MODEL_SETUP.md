# LOCAL_MODEL_SETUP.md

How to get **Whisper Tiny** and **Wav2Vec2 Base 960h** running locally for
the VoiceLearn Africa benchmark. These are BENCHMARK COMPARATORS ONLY —
Sahara v2.5 remains the production speech model and needs no local files,
only `SAHARA_API_KEY` in `.env.local`.

**Current status in this repo:** `models/whisper-tiny/` and
`models/wav2vec2-base-960h/` each contain **only `model.safetensors`**.
Every other required file is missing. Neither model can load until you
add the missing files below.

The file lists are audited directly against what the code actually loads:

- `scripts/asr/whisper_worker.py` calls
  `transformers.pipeline("automatic-speech-recognition", model=<local dir>)`,
  which internally resolves a Whisper feature extractor, tokenizer,
  generation config, and model weights from that same directory.
- `scripts/asr/wav2vec2_worker.py` calls
  `Wav2Vec2Processor.from_pretrained(<local dir>)` and
  `Wav2Vec2ForCTC.from_pretrained(<local dir>)` directly.
- The single source of truth for the required-file lists is
  `lib/speech/model-requirements.ts`; the two Python workers keep their
  own copy in sync by hand (a Python process can't import a `.ts` file).

> **Honesty note:** the sandbox this was audited in has no network access
> to huggingface.co, so these lists reflect what the worker code requires
> to run, not a byte-for-byte live re-fetch of each repo's file listing.
> Both repos are old, stable, widely-used models unlikely to have changed
> shape. Verify with Section 5 after downloading.

---

## 1. What you already have vs. what's missing

| | `models/whisper-tiny/` | `models/whisper-base/` | `models/wav2vec2-base-960h/` |
|---|---|---|---|
| Have | `model.safetensors` (144 MB) | **nothing** — not downloaded at all | `model.safetensors` (360 MB) |
| Missing | `config.json`, `generation_config.json`, `preprocessor_config.json`, `tokenizer_config.json`, `vocab.json`, `merges.txt` | Everything, including the weights (~290 MB for `openai/whisper-base`) | `config.json`, `preprocessor_config.json`, `tokenizer_config.json`, `vocab.json` |

## 2. Exact files required — audited per file

### Whisper Tiny (`models/whisper-tiny/`)

| File | Required? | Why |
|---|---|---|
| `config.json` | **Required** | Model architecture config — `pipeline()` cannot construct the model without it. |
| `generation_config.json` | **Required** | Whisper's `generate()` depends on this for language/task forcing and suppressed-token behavior. |
| `preprocessor_config.json` | **Required** | Feature extractor config (audio → log-mel spectrogram parameters). |
| `tokenizer_config.json` | **Required** | Tokenizer settings used when decoding token ids back to text. |
| `vocab.json` | **Required** | BPE vocabulary — needed by the (slow) tokenizer path this worker uses. |
| `merges.txt` | **Required** | BPE merge rules — required alongside `vocab.json`. |
| `model.safetensors` (have) | **Required** | The weights. Already present — don't also add `pytorch_model.bin`, you don't need both. |
| `tokenizer.json`, `special_tokens_map.json`, `added_tokens.json`, `normalizer.json` | Not required | Harmless if present; this worker doesn't need them (fast-tokenizer fallback, optional metadata, or an optional `.normalize()` helper it never calls). |

### Whisper Base (`models/whisper-base/`)

Same architecture family as Whisper Tiny — identical required-file shape, larger weights.

| File | Required? | Why |
|---|---|---|
| `config.json` | **Required** | Same reason as Whisper Tiny. |
| `generation_config.json` | **Required** | Same reason as Whisper Tiny. |
| `preprocessor_config.json` | **Required** | Same reason as Whisper Tiny. |
| `tokenizer_config.json` | **Required** | Same reason as Whisper Tiny. |
| `vocab.json` | **Required** | Same reason as Whisper Tiny. |
| `merges.txt` | **Required** | Same reason as Whisper Tiny. |
| `model.safetensors` | **Required** | Not yet downloaded at all for this model — see Section 3. |

### Wav2Vec2 Base 960h (`models/wav2vec2-base-960h/`)

| File | Required? | Why |
|---|---|---|
| `config.json` | **Required** | Needed to construct `Wav2Vec2ForCTC`. |
| `preprocessor_config.json` | **Required** | The actual filename `Wav2Vec2Processor` looks for (`feature_extractor_config.json` is not the modern filename for this model — don't bother with it). |
| `tokenizer_config.json` | **Required** | CTC tokenizer settings read by `Wav2Vec2Processor.from_pretrained()`. |
| `vocab.json` | **Required** | The CTC character vocabulary — mandatory for `Wav2Vec2CTCTokenizer`. |
| `model.safetensors` (have) | **Required** | The weights. Already present. |
| `feature_extractor_config.json`, `special_tokens_map.json` | Not required | Superseded/redundant for this model. |

## 3. How to download only the missing pieces

On a machine with internet access:

```bash
pip install -U "huggingface_hub[cli]"

huggingface-cli download openai/whisper-tiny \
  --local-dir ./whisper-tiny-extra \
  --include "config.json" "generation_config.json" "preprocessor_config.json" "tokenizer_config.json" "vocab.json" "merges.txt"

huggingface-cli download openai/whisper-base \
  --local-dir ./whisper-base \
  --include "config.json" "generation_config.json" "preprocessor_config.json" "tokenizer_config.json" "vocab.json" "merges.txt" "model.safetensors"

huggingface-cli download facebook/wav2vec2-base-960h \
  --local-dir ./wav2vec2-base-960h-extra \
  --include "config.json" "preprocessor_config.json" "tokenizer_config.json" "vocab.json"
```

These are all small text files (a few KB to a few hundred KB total) for Whisper Tiny and Wav2Vec2 — nothing like the size of the weights you already have. Whisper Base is a full download (~290 MB) since none of its files exist yet.

Copy the downloaded files into the existing folders, next to the `model.safetensors` that's already there (Whisper Base gets its own new folder):

```
models/whisper-tiny/
  config.json              ← add
  generation_config.json   ← add
  preprocessor_config.json ← add
  tokenizer_config.json    ← add
  vocab.json               ← add
  merges.txt               ← add
  model.safetensors         (already present — do not touch/rename)

models/whisper-base/        ← new folder, everything added
  config.json
  generation_config.json
  preprocessor_config.json
  tokenizer_config.json
  vocab.json
  merges.txt
  model.safetensors

models/wav2vec2-base-960h/
  config.json              ← add
  preprocessor_config.json ← add
  tokenizer_config.json    ← add
  vocab.json               ← add
  model.safetensors         (already present — do not touch/rename)
```

Do not add `pytorch_model.bin` anywhere you already have (or just downloaded) `model.safetensors` — the code only needs one weight format.

## 4. Exact environment variables

In `.env.local`:

```bash
WHISPER_LOCAL_MODEL_PATH=./models/whisper-tiny
WHISPER_BASE_LOCAL_MODEL_PATH=./models/whisper-base
WAV2VEC2_LOCAL_MODEL_PATH=./models/wav2vec2-base-960h
```

These match the defaults, so they're optional, but setting them explicitly makes it obvious where the code is looking. Never put a Windows username or drive letter in these paths — use a relative path as shown.

## 5. Commands to verify the files are correct

```bash
ls models/whisper-tiny
ls models/wav2vec2-base-960h
npm run benchmark:health
```

`benchmark:health` reports, per model, `✅ READY` or `📥 BLOCKED (MODEL_NOT_FOUND — see LOCAL_MODEL_SETUP.md)` with the exact missing file(s) if any remain.

## 6. Commands to test each model individually

```bash
pip install -r scripts/asr/requirements.txt

python scripts/asr/whisper_worker.py --audio benchmark/audio/learner_recording_01.wav --model ./models/whisper-tiny --repo-id openai/whisper-tiny

python scripts/asr/wav2vec2_worker.py --audio benchmark/audio/learner_recording_01.wav --model ./models/wav2vec2-base-960h --repo-id facebook/wav2vec2-base-960h
```

`"success": true` with a non-empty `"transcript"` means that model is genuinely working end-to-end.

## 7. Final verification command

```bash
npm run benchmark:verify
```

Checks environment, model paths, model files, Sahara config, audio fixtures, runs a smoke test per local model, then runs the real three-model benchmark and prints a final VERIFIED/BLOCKED summary.
