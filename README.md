# VoiceLearn Africa

> **Learning should understand the learner, not force the learner to change how they speak.**

An adaptive voice-learning AI system for African secondary-school learners, built around **Intron Sahara v2.5** African code-switching speech intelligence, with empirical local benchmarking against **OpenAI Whisper Large v3** and **Meta Wav2Vec2 Large 960h**.

Submitted by the Regamos Foundation to the **Intron Sahara CodeSwitch Africa Challenge**.

---

## 1. System Architecture

```
                    LIVE APP
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


                 RESEARCH LAB
                       │
              Same normalized audio
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Sahara         Whisper       Wav2Vec2
     v2.5           Large v3       Large 960h
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

---

## 2. Model Implementation & Operational Matrix

| Model | Identifier | Runtime | License | Role in Benchmark | API Key Required? |
|---|---|---|---|---|:---:|
| **Model A**: Intron Sahara v2.5 | `sahara` | Remote WebSocket API | Commercial | Required Challenge Model (African code-switching specialist) | **YES** (`SAHARA_API_KEY`) |
| **Model B**: OpenAI Whisper Large v3 | `whisper-large-v3` | Local Open-Weights | [Apache-2.0](https://huggingface.co/openai/whisper-large-v3) | Open-source global multilingual baseline | **NO** (Zero Paid API) |
| **Model C**: Meta Wav2Vec2 Large 960h | `wav2vec2-large-960h` | Local Open-Weights | [Apache-2.0](https://huggingface.co/facebook/wav2vec2-large-960h) | Independent English LibriSpeech baseline (~1.26 GB) | **NO** (Zero Paid API) |

> **Fair Comparison Notice:** Sahara is evaluated as the challenge-specific speech model. Whisper Large v3 and Wav2Vec2 Large 960h are independently executed local open-weight baselines under Apache-2.0 licenses. All models receive the exact same normalized audio (16kHz mono PCM16, SHA-256 verified) and are evaluated against identical human-reviewed reference transcripts.

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

- **OpenAI Whisper Large v3:** [openai/whisper-large-v3](https://huggingface.co/openai/whisper-large-v3), licensed under Apache-2.0.
- **Meta Wav2Vec2 Large 960h:** [facebook/wav2vec2-large-960h](https://huggingface.co/facebook/wav2vec2-large-960h), licensed under Apache-2.0.
