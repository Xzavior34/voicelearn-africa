# VoiceLearn Africa — Four-Model Code-Switching Speech Benchmark Report
**Generated:** 2026-09-14
**Run ID:** `run-1789350091875`

---

## 1. Dataset

- **Total records:** 35
- **Physical audio recordings:** 2 (vl-001, vl-035)
- **Physical CODE-SWITCHED audio recordings:** 1 (vl-035) — genuine human-recorded code-switched speech, see DATASET.md.
- **Text-only functional fixtures (no audio file):** 33
- **Audio format (where present):** PCM16 mono WAV
- **Language pairs:** en (7), pcm (6), en-pcm (16), en-yo (6)
- **Noise conditions:** quiet (32), mild (2), moderate (1)
- **Device types:** smartphone (35)
- **Speaker country:** Nigeria (35)
- **Speaker accent:** West African English (8), Nigerian Pidgin (7), Code-switched Nigerian English/Pidgin (13), Yoruba / English code-switching (6), Nigerian English / Pidgin (1)

**Physical audio benchmark** (the numbers below) covers only the 2 sample(s) listed above — a small, honest sample size; do not draw population-level conclusions from it. **Text-only functional fixtures** are used solely for the Part 2 ground-truth intent/topic baseline — they are never a substitute for measured ASR accuracy on real speech.

---

## 2. Multi-Model Speech Recognition Comparison

Only physical audio samples are eligible for measurement below. Cells show "N/A" where a metric genuinely was not measured — never a fabricated or assumed value.

| Model | Physical Samples | WER | CER | CS-WER | Latency | Learning Success | Status |
|---|---|---|---|---|---|---|---|
| **Intron Sahara v2.5** | 2/2 | 40.2% | 37.0% | 76.8% | 15983ms | 50.0% | `VERIFIED` |
| **OpenAI Whisper Tiny (Local, Filesystem-Only)** | 1/2 | 25.0% | 11.9% | N/A | 43655ms | 100.0% | `VERIFIED` |
| **OpenAI Whisper Base (Local, Filesystem-Only)** | 1/2 | 17.9% | 10.3% | N/A | 85229ms | 100.0% | `VERIFIED` |
| **Meta Wav2Vec2 Base 960h (Local Baseline, Filesystem-Only)** | 2/2 | 71.4% | 34.7% | 85.7% | 47198ms | 50.0% | `VERIFIED` |

Status meanings: `VERIFIED` = at least one real measurement on physical audio. `BLOCKED (MODEL_NOT_FOUND)` = local model files incomplete/absent. `BLOCKED (REQUIRES_API_ACCESS)` = remote API key not configured. `BLOCKED_RUNTIME` = physical audio and model files exist, but the inference runtime itself failed (e.g. a timeout on constrained hardware). `FAILED` = an unexpected error occurred while measuring. `CONFIGURED_NOT_MEASURED` = model reports ready and audio exists, but no attempt has completed yet. `AUDIO_DATASET_REQUIRED` = reserved for when the dataset has zero physical audio at all.

**Read the numbers, not just the status column.** `VERIFIED` means a real measurement occurred — it does not mean the measured accuracy is high. On this run's genuine code-switched recording (CS-WER column), measured models show a high error rate (76.8%–85.7%) — real, useful signal about how hard this benchmark's code-switching is.

---

## 3. Downstream Agentic Learning Pipeline (Ground Truth Baseline)

- **Total Initial Turns:** 33
- **Concept Entity Extraction Accuracy:** 78.8% (26/33)
- **Curriculum Topic Match Accuracy:** 78.8%

This baseline uses ground-truth (human-authored) transcripts to isolate downstream reasoning accuracy from ASR accuracy. It is not a substitute for Section 2's real ASR measurement.

---

## 4. Fair Comparison Notice

Sahara is evaluated as the challenge-specific, production speech model. Whisper Tiny, Whisper Base, and Wav2Vec2 Base 960h are independently executed local, filesystem-only benchmark comparators under Apache-2.0 licenses — none of them are ever used in the production learner-facing app. Wav2Vec2 Base 960h is an English/LibriSpeech baseline, not an African-language specialist. All models receive the exact same normalized audio and are evaluated against identical human-reviewed reference transcripts. No model is tuned per-recording.

---

## 5. Limitations

- The physical audio dataset currently has **2 recording(s)**. Do not draw population-level conclusions from this sample size.
- Whisper Tiny and Whisper Base did not produce a measurement on the longer (26.6s) code-switched recording in this run (a real constrained-hardware timeout on the test device).
- Historical benchmark numbers referenced elsewhere in this repository's documentation predate this run and should not be cited — always prefer this file and `benchmark/results/summary.json`.
