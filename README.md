# VoiceLearn Africa

> **Learning should understand the learner, not force the learner to change how they speak.**

An adaptive voice-learning AI system for African secondary-school learners, built around **Intron Sahara v2.5** African code-switching speech intelligence (the production speech model), with empirical local benchmarking against **OpenAI Whisper Tiny** and **Meta Wav2Vec2 Base 960h**.

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
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Sahara         Whisper       Wav2Vec2
     v2.5           Tiny          Base 960h
   Remote API       LOCAL          LOCAL
        │              │              │
        └──────────────┼──────────────┘
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

The production learner-facing app only ever calls Sahara. Whisper Tiny and
Wav2Vec2 Base 960h are benchmark comparators, run locally and offline —
they never replace Sahara in the live product, and the public Vercel
deployment does not run them (see Section 5).

---

## 2. Model Implementation & Operational Matrix

| Model | Identifier | Runtime | License | Role | API Key Required? |
|---|---|---|---|---|:---:|
| **Model A**: Intron Sahara v2.5 | `sahara` | Remote WebSocket API | Commercial | **Production** speech model + benchmark | **YES** (`SAHARA_API_KEY`) |
| **Model B**: OpenAI Whisper Tiny | `whisper-tiny` | Local, filesystem-only | Apache-2.0 (per the Hugging Face Hub repo's license tag) | Benchmark comparator only — lightweight open-source multilingual baseline | **NO** (Zero Paid API) |
| **Model C**: Meta Wav2Vec2 Base 960h | `wav2vec2-base-960h` | Local, filesystem-only | Apache-2.0 | Benchmark comparator only — English/LibriSpeech baseline, **not** an African-language or Pidgin specialist | **NO** (Zero Paid API) |

> **Fair Comparison Notice:** Sahara is evaluated as the challenge-specific speech model. Whisper Tiny and Wav2Vec2 Base 960h are independently executed local, filesystem-only baselines under Apache-2.0 licenses, chosen for constrained-hardware benchmarking. All models receive the exact same normalized audio (16kHz mono PCM16, SHA-256 verified) and are evaluated against identical human-reviewed reference transcripts.

---

## 3. Dataset & Linguistic Tiers (34 Curriculum Samples)

The benchmark dataset (`lib/benchmark/dataset/dataset.ts`) spans 4 linguistic tiers across secondary Mathematics, Biology, Science, English Language, Physics, and Chemistry:

1. **Tier 1: Standard English (6 samples):** Monolingual formal West African English questions.
2. **Tier 2: Nigerian Pidgin (6 samples):** Monolingual Nigerian Pidgin educational phrasing (*"Why negative times negative dey give positive?"*).
3. **Tier 3: English + Pidgin Code-Switching (14 samples):** Natural classroom code-switching (*"Teacher talk say photosynthesis dey use light energy, but why chlorophyll dey absorb light like that?"*).
4. **Tier 4: English + Yoruba Code-Switching (6 samples):** Intra-sentential code-switching mixing Yoruba syntax with English subject vocabulary (*"Bawo ni photosynthesis se n sele ninu ewe?"*).
5. **Downstream Follow-up Turns (2 samples):** Learner answers verifying misconception assessment.

---

## 4. Downstream Agentic Task & Speech-to-Learning Metric

VoiceLearn Africa evaluates speech models on **Speech-to-Learning Success**:

$$\text{Speech-to-Learning Success} = \text{Faithful Transcription} \wedge \text{Correct Intent} \wedge \text{Curriculum Topic} \wedge \text{Valid Pedagogical Explanation}$$

- **Concept Extraction Accuracy:** **81.3%**
- **Topic Identification Accuracy:** **87.5%**
- **Socratic Explanation Validity:** **100%**

---

## 5. Auditability & Reproducibility Commands

```bash
# 1. Run safe 3-model connectivity and local environment health check
npm run benchmark:health

# 2. Run the 3-model benchmark and generate machine/human readable reports
npm run benchmark

# 3. Run full automated test suite (131 unit tests)
npm test

# 4. Typecheck, lint, and production build
npm run typecheck
npm run lint
npm run build
```

---

## 6. Open Source Model Licenses & Attributions

- **OpenAI Whisper Tiny:** [openai/whisper-tiny](https://huggingface.co/openai/whisper-tiny), licensed under Apache-2.0 (per the Hugging Face Hub repo's license tag).
- **Meta Wav2Vec2 Base 960h:** [facebook/wav2vec2-base-960h](https://huggingface.co/facebook/wav2vec2-base-960h), licensed under Apache-2.0. Trained on LibriSpeech (English) — not an African-language or Pidgin specialist.
