# VoiceLearn Africa — Four-Model Code-Switching Speech Benchmark Report
**Generated:** 2026-09-13
**Run ID:** `run-1789332135635`

---

## 1. Dataset

- **Total records:** 34
- **Physical audio recordings:** 1 (vl-001)
- **Physical CODE-SWITCHED audio recordings:** 0 — **PENDING HUMAN RECORDING**, see DATASET.md Section 4. Do not treat any text fixture below as audio evidence.
- **Text-only functional fixtures (no audio file):** 33
- **Audio format (where present):** PCM16 mono WAV
- **Language pairs:** en (7), pcm (6), en-pcm (15), en-yo (6)
- **Noise conditions:** quiet (31), mild (2), moderate (1)
- **Device types:** smartphone (34)
- **Speaker country:** Nigeria (34)
- **Speaker accent:** West African English (8), Nigerian Pidgin (7), Code-switched Nigerian English/Pidgin (13), Yoruba / English code-switching (6)

**Physical audio benchmark** (the numbers below) covers only the 1 sample(s) listed above. **Text-only functional fixtures** are used solely for the Part 2 ground-truth intent/topic baseline — they are never a substitute for measured ASR accuracy on real speech.

---

## 2. Multi-Model Speech Recognition Comparison

Only physical audio samples are eligible for measurement below. Cells show "N/A" where a metric genuinely was not measured — never a fabricated or assumed value.

| Model | Physical Samples | WER | CER | CS-WER | Latency | Learning Success | Status |
|---|---|---|---|---|---|---|---|
| **Intron Sahara v2.5** | 1/1 | 17.9% | 12.7% | N/A | 22081ms | 100.0% | `VERIFIED` |
| **OpenAI Whisper Tiny (Local, Filesystem-Only)** | 0/1 | N/A | N/A | N/A | N/A | N/A | `BLOCKED_RUNTIME` |
| **OpenAI Whisper Base (Local, Filesystem-Only)** | 0/1 | N/A | N/A | N/A | N/A | N/A | `BLOCKED (MODEL_NOT_FOUND)` |
| **Meta Wav2Vec2 Base 960h (Local Baseline, Filesystem-Only)** | 0/1 | N/A | N/A | N/A | N/A | N/A | `BLOCKED_RUNTIME` |

Status meanings: `VERIFIED` = at least one real measurement on physical audio. `BLOCKED (MODEL_NOT_FOUND)` = local model files incomplete/absent. `BLOCKED (REQUIRES_API_ACCESS)` = remote API key not configured. `BLOCKED_RUNTIME` = physical audio and model files exist, but the inference runtime itself failed (e.g. Python/PyTorch unavailable on this device). `FAILED` = an unexpected error occurred while measuring. `CONFIGURED_NOT_MEASURED` = model reports ready and audio exists, but no attempt has completed yet. `AUDIO_DATASET_REQUIRED` = reserved for when the dataset has zero physical audio at all — not used while physical audio exists.

---

## 3. Downstream Agentic Learning Pipeline (Ground Truth Baseline)

- **Total Initial Turns:** 32
- **Concept Entity Extraction Accuracy:** 81.3% (26/32)
- **Curriculum Topic Match Accuracy:** 81.3%

This baseline uses ground-truth (human-authored) transcripts to isolate downstream reasoning accuracy from ASR accuracy — it answers "if speech recognition were perfect, how good is the educational reasoning?" It is not a substitute for Section 2's real ASR measurement.

---

## 4. Fair Comparison Notice

Sahara is evaluated as the challenge-specific, production speech model. Whisper Tiny, Whisper Base, and Wav2Vec2 Base 960h are independently executed local, filesystem-only benchmark comparators under Apache-2.0 licenses — none of them are ever used in the production learner-facing app. Wav2Vec2 Base 960h is an English/LibriSpeech baseline, not an African-language specialist. All models receive the exact same normalized audio and are evaluated against identical human-reviewed reference transcripts. No model is tuned per-recording.

---

## 5. Limitations

- The physical audio dataset currently has **1 recording(s)**. Do not draw population-level conclusions from this sample size — treat any measured WER/CER here as a single-sample case study, not a statistically powered claim.
- **Zero physical code-switched audio recordings exist as of this report.** Code-switching behavior is currently evidenced only through text-only fixtures and the tutor's topic/intent handling — not through measured ASR accuracy on genuine code-switched speech.
- Historical benchmark numbers referenced elsewhere in this repository's documentation may not match this run — always prefer the numbers in this file and `benchmark/results/summary.json` over older prose claims.
