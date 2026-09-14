# VoiceLearn Africa

> **Learning should understand the learner, not force the learner to change how they speak.**

An adaptive voice-learning AI system for African secondary-school learners, built around **Intron Sahara v2.5** African code-switching speech intelligence (the production speech model), with empirical local benchmarking against **OpenAI Whisper Tiny**, **OpenAI Whisper Base**, and **Meta Wav2Vec2 Base 960h**.

Submitted by the Regamos Foundation to the **Intron Sahara CodeSwitch Africa Challenge**.

---

## 1. System Architecture

```
                    LIVE APP (PRODUCTION)
                       │
                       ▼
              Intron Sahara v2.5
                  Remote API
                       │
                       ▼
              Adaptive Tutor
                       │
             Explain → Practice
                       │
                    Assess


                 RESEARCH LAB (BENCHMARK ONLY)
                       │
              Same normalized audio
                       │
    ┌──────────────┬───────────────┬──────────────┐
    ▼              ▼               ▼              ▼
 Sahara         Whisper        Whisper         Wav2Vec2
 v2.5           Tiny           Base            Base 960h
Remote API      LOCAL          LOCAL           LOCAL
    │              │               │              │
    └──────────────┴───────────────┴──────────────┘
                       ▼
                Same references
                       │
                       ▼
             WER / CER / CS-WER
                       │
                       ▼
             Same Tutor Pipeline
                       │
                       ▼
          Speech-to-Learning Success
```

The production learner-facing app only ever calls Sahara. Whisper Tiny,
Whisper Base, and Wav2Vec2 Base 960h are benchmark comparators, run
locally and offline — they never replace Sahara in the live product, and
the public Vercel deployment does not run them (see Section 5).

---

## 2. Model Implementation & Operational Matrix

| Model | Identifier | Runtime | License | Role | API Key Required? |
|---|---|---|---|---|:---:|
| **Model A**: Intron Sahara v2.5 | `sahara` | Remote WebSocket API | Commercial | **Production** speech model + benchmark | **YES** (`SAHARA_API_KEY`) |
| **Model B**: OpenAI Whisper Tiny | `whisper-tiny` | Local, filesystem-only | Apache-2.0 (per the Hugging Face Hub repo's license tag) | Benchmark comparator only — lightweight open-source multilingual baseline | **NO** (Zero Paid API) |
| **Model C**: OpenAI Whisper Base | `whisper-base` | Local, filesystem-only | Apache-2.0 (per the Hugging Face Hub repo's license tag) | Benchmark comparator only — larger checkpoint in the same family as Whisper Tiny, for a same-architecture size comparison | **NO** (Zero Paid API) |
| **Model D**: Meta Wav2Vec2 Base 960h | `wav2vec2-base-960h` | Local, filesystem-only | Apache-2.0 | Benchmark comparator only — English/LibriSpeech baseline, **not** an African-language or Pidgin specialist | **NO** (Zero Paid API) |

> **Fair Comparison Notice:** Sahara is evaluated as the challenge-specific speech model. Whisper Tiny, Whisper Base, and Wav2Vec2 Base 960h are independently executed local, filesystem-only baselines under Apache-2.0 licenses, chosen for constrained-hardware benchmarking. All models receive the exact same normalized audio (16kHz mono PCM16, SHA-256 verified) and are evaluated against identical human-reviewed reference transcripts. Local model weights are **not** committed to this repository — see `LOCAL_MODEL_SETUP.md` to reproduce the local benchmark comparators.

> **Read the results honestly, not as a leaderboard:** all four models are `VERIFIED` (a real measurement occurred), but that is not a claim that any of them is highly accurate. On this repo's real, current run (`benchmark/results/summary.json`), WER ranges from 17.9% to 71.4%, and on the one genuine code-switched recording, every model's error rate is high (76.8%–85.7%). Do not present Sahara as "the most accurate" model without checking the actual current numbers in `FINAL_SUBMISSION_EVIDENCE.md` — the honest, current comparison is close and sample-size-limited (N=2 physical recordings), not a clear ranking.

---

## 3. Dataset & Linguistic Tiers (35 Curriculum Samples)

The benchmark dataset (`lib/benchmark/dataset/dataset.ts`) spans 4 linguistic tiers across secondary Mathematics, Biology, Science, English Language, Physics, and Chemistry:

1. **Tier 1: Standard English (6 samples):** Monolingual formal West African English questions.
2. **Tier 2: Nigerian Pidgin (6 samples):** Monolingual Nigerian Pidgin educational phrasing (*"Why negative times negative dey give positive?"*).
3. **Tier 3: English + Pidgin Code-Switching (15 samples):** Natural classroom code-switching (*"Teacher talk say photosynthesis dey use light energy, but why chlorophyll dey absorb light like that?"*).
4. **Tier 4: English + Yoruba Code-Switching (6 samples):** Intra-sentential code-switching mixing Yoruba syntax with English subject vocabulary (*"Bawo ni photosynthesis se n sele ninu ewe?"*).
5. **Downstream Follow-up Turns (2 samples):** Learner answers verifying misconception assessment.

**Physical audio recordings: 2 of the 35 samples** have a genuine, human-recorded audio file on disk (everything else is a text-only fixture used for the tutor's intent/topic reasoning tests, not ASR evidence):
- `vl-001` — `benchmark/audio/learner_recording_01.wav` — standard English, not code-switched.
- `vl-035` — `benchmark/audio/affect_codeswitch_01.wav` — **genuine English/Nigerian-Pidgin code-switched speech**, recorded on a smartphone.

Local model weights (Whisper Tiny/Base, Wav2Vec2 Base 960h) are **not** committed to this repository — only the two small WAV fixtures above are. See `LOCAL_MODEL_SETUP.md` to set up the local models yourself, and `DATASET.md` for full hashes/format/consent details.

---

## 4. Downstream Agentic Task & Speech-to-Learning Metric

VoiceLearn Africa evaluates speech models on **Speech-to-Learning Success**:

$$\text{Speech-to-Learning Success} = \text{Faithful Transcription} \wedge \text{Correct Intent} \wedge \text{Curriculum Topic} \wedge \text{Valid Pedagogical Explanation}$$

- **Concept Extraction Accuracy:** **78.8%** (26/33 initial-question samples)
- **Topic Identification Accuracy:** **78.8%** (26/33 initial-question samples)

These are computed from `lib/benchmark/reports/intent-baseline-latest.json` / `benchmark/results/summary.json`'s `intentBaseline` field — a ground-truth-transcript baseline (ASR skipped) that isolates the tutor's reasoning layer. It is not a claim about any speech model's transcription accuracy — see Section 2 and `FINAL_SUBMISSION_EVIDENCE.md` for the real, measured ASR numbers.

---

## 5. Auditability & Reproducibility Commands

Environment variables (see `.env.example`): `SAHARA_API_KEY` is **required** to reproduce the Sahara result — there is no way to run it without real credentials. The three local models require no API key, but do require their weight files to be present locally (not committed to this repo — see `LOCAL_MODEL_SETUP.md`) at `models/whisper-tiny/`, `models/whisper-base/`, and `models/wav2vec2-base-960h/`.

```bash
# 1. Run connectivity and local environment health check (all 4 models)
npm run benchmark:health

# 2. Run the 4-model benchmark and generate machine/human readable reports
npm run benchmark

# 3. Run the full verification pass (health + smoke tests + full benchmark + validation)
npm run benchmark:verify

# 4. Run full automated test suite (143 unit tests)
npm test

# 5. Typecheck, lint, and production build
npm run typecheck
npm run lint
npm run build
```

Results are written to `benchmark/results/summary.json` and `benchmark/results/raw-results.json` (also mirrored to `lib/benchmark/reports/`). The physical code-switched audio fixture used in the verified run is `benchmark/audio/affect_codeswitch_01.wav`. See `FINAL_SUBMISSION_EVIDENCE.md` for the current verified benchmark numbers.

---

## 6. Open Source Model Licenses & Attributions

- **OpenAI Whisper Tiny:** [openai/whisper-tiny](https://huggingface.co/openai/whisper-tiny), licensed under Apache-2.0 (per the Hugging Face Hub repo's license tag).
- **OpenAI Whisper Base:** [openai/whisper-base](https://huggingface.co/openai/whisper-base), licensed under Apache-2.0 (per the Hugging Face Hub repo's license tag).
- **Meta Wav2Vec2 Base 960h:** [facebook/wav2vec2-base-960h](https://huggingface.co/facebook/wav2vec2-base-960h), licensed under Apache-2.0. Trained on LibriSpeech (English) — not an African-language or Pidgin specialist.
