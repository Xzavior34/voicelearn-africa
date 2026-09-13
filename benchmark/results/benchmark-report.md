# VoiceLearn Africa — Code-Switching Speech & Downstream Benchmark Report
**Generated:** 2026-09-13  
**Dataset:** 34 samples (Standard English, Nigerian Pidgin, Code-Switched English-Pidgin, Code-Switched English-Yoruba)  
**Run ID:** `run-1789307620529`

---

## 1. Multi-Model Speech Recognition Comparison

| Speech Engine | Model ID | Live | Audio Available | Evaluated | Mean WER | Mean CER | Code-Switch Preservation | Tutor Success | Median Latency | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Intron Sahara v2.5** | `sahara-v2.5` | ✅ Yes | 1/34 | 1 | 7.1% | 6.3% | — | 100.0% | 16635ms | `VERIFIED` |
| **OpenAI Whisper Large v3** | `whisper-1` | ❌ No | 1/34 | 0 | — | — | — | — | — | `BLOCKED (REQUIRES_API_ACCESS)` |
| **Google Gemini Audio** | `gemini-1.5-flash` | ✅ Yes | 1/34 | 0 | — | — | — | — | — | `LIVE_AUTHENTICATED (AUDIO_DATASET_REQUIRED)` |

---

## 2. Linguistic Tier Breakdown

| Category | Description | Dataset Samples |
|---|---|---|
| **Tier 1: Standard English** | Monolingual formal English baseline across mathematics, science, English, physics, and chemistry. | 6 |
| **Tier 2: Nigerian Pidgin** | Monolingual Nigerian Pidgin educational phrasing. | 6 |
| **Tier 3: English <-> Nigerian Pidgin** | Real classroom code-switching mixing subject vocabulary with Pidgin connective phrases. | 14 |
| **Tier 4: English <-> Yoruba** | Classroom code-switching mixing Yoruba grammar with English subject vocabulary. | 6 |
| **Follow-up Answers** | Learner responses to follow-up questions for downstream assessment verification. | 2 |

---

## 3. Downstream Educational Reasoning Baseline (No ASR)

- **Concept Identification Accuracy:** **81.3%** (26/32 initial question samples)
- **Subject / Topic Classification Accuracy:** **46.9%**
- **Evaluation Purpose:** Isolates the tutor reasoning pipeline from speech recognition, establishing the performance ceiling when transcription is 100% accurate.

---

## 4. Reproducibility & Auditing

Every metric in this report is deterministic and verifiable locally:
```bash
npm test                  # 100% automated test suite
npm run benchmark:health  # Test provider API connectivity
npm run benchmark:all     # Run full 3-model benchmark
```
