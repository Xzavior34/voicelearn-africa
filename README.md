# VoiceLearn Africa

> **Learning should understand the learner, not force the learner to change how they speak.**

An adaptive voice-learning AI system for African secondary-school learners, built around **Intron Sahara v2.5** African code-switching speech intelligence, with empirical benchmarking against **OpenAI Whisper Large v3** and **Google Gemini Audio**.

Submitted by the Regamos Foundation to the **Intron Sahara CodeSwitch Africa Challenge**.

---

## 1. Problem & Context

In classrooms across Nigeria and West Africa, secondary-school learners naturally move between Standard English, Nigerian Pidgin, and indigenous languages like Yoruba — often within a single question. 

Generic voice systems trained primarily on Western, monolingual speech routinely mishear or reject this natural mixing, forcing learners to translate their thinking into formal English before they can ask for help.

---

## 2. Solution: Agentic Tutoring Pipeline

VoiceLearn Africa treats speech recognition as the perceptual front door to an autonomous educational reasoning agent:

```
Learner Speaks (Code-Switched Voice)
                 │
                 ▼
     Speech Model (Intron Sahara v2.5)
                 │
                 ▼
   Code-Switch Faithful Transcript
                 │
                 ▼
  Intent & Curriculum Concept Extraction
                 │
                 ▼
     Intuition-First Explanation
                 │
                 ▼
    Diagnostic Ladder Question (Voice/Text)
                 │
                 ▼
 Misconception Assessment & Adaptive Level Progression
```

---

## 3. Three-Model Code-Switching Benchmark

VoiceLearn Africa includes an empirical benchmark comparing three speech models across a 34-sample dataset:

| Model | Identifier | Status | Architecture | Focus Area |
|---|---|---|---|---|
| **Intron Sahara v2.5** | `sahara` | **LIVE VERIFIED** (7.1% WER) | Streaming WebSocket | African accents & Code-Switching (English, Pidgin, Yoruba) |
| **OpenAI Whisper Large v3** | `whisper-large-v3` | **CONFIGURABLE** (`whisper-1`) | REST Multipart | Global Multilingual Speech Foundation Model |
| **Google Gemini Audio** | `gemini` | **CONFIGURABLE** (`gemini-1.5-flash`) | REST Audio Generative | Multimodal Audio Understanding Model |

---

## 4. Multi-Tier Code-Switching Dataset (34 Samples)

The benchmark dataset (`lib/benchmark/dataset/dataset.ts`) spans 4 linguistic tiers across secondary Mathematics, Biology, Science, English Language, Physics, and Chemistry:

1. **Tier 1: Standard English (6 samples):** Monolingual formal West African English questions.
2. **Tier 2: Nigerian Pidgin (6 samples):** Monolingual Nigerian Pidgin educational phrasing (*"Why negative times negative dey give positive?"*).
3. **Tier 3: English + Pidgin Code-Switching (14 samples):** Natural classroom code-switching (*"Teacher talk say photosynthesis dey use light energy, but why chlorophyll dey absorb light like that?"*).
4. **Tier 4: English + Yoruba Code-Switching (6 samples):** Code-switching mixing Yoruba grammar with English subject vocabulary (*"Kí ló dé tí negative times negative fi ń fún wa ní positive?"*).
5. **Downstream Follow-up Answers (2 samples):** Learner answers verifying misconception assessment.

---

## 5. Downstream Agentic Task Accuracy

When evaluated on the hand-reviewed reference transcripts without speech distortion:
- **Concept Extraction Accuracy:** **81.3%**
- **Topic Identification Accuracy:** **87.5%**
- **Pedagogical Follow-up Validity:** **100%**

This proves that when speech recognition preserves the learner's actual words, the downstream educational intelligence correctly teaches the subject.

---

## 6. Auditability & Reproducibility

Every benchmark result is verifiable locally:

```bash
# 1. Test model credentials safely
npm run benchmark:health

# 2. Run the 3-model benchmark & generate reports
npm run benchmark:all

# 3. Run full automated test suite (130 unit tests)
npm test

# 4. Typecheck & build
npm run typecheck
npm run build
```

Generated reports are persisted in:
- `benchmark/results/raw-results.json`
- `benchmark/results/summary.json`
- `benchmark/results/benchmark-report.md`
- `lib/benchmark/reports/asr-comparison-latest.json`

---

## 7. Responsible AI & Safety

- **Informed Consent:** Physical voice recordings are collected exclusively with documented informed consent from adult participants.
- **Child Safeguarding:** Children's voices are never recorded or stored.
- **Zero Profiling:** Audio is processed ephemerally in memory; zero biometric profiles or PII are retained.
- **Non-Punitive Design:** VoiceLearn assists learners alongside teachers and is never used for grading or disciplinary decisions.
- **Explicit Failure States:** When speech is ambiguous, the system politely prompts for repetition or typed fallback.

See [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md) and [BENCHMARK.md](BENCHMARK.md) for full documentation.

---

## 8. Stack & Quickstart

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (Light Premium Palette)
- **Validation:** Zod schemas for all speech & tutor boundaries
- **Testing:** Vitest (130 passing tests)

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to try the live tutoring console and [http://localhost:3000/benchmark](http://localhost:3000/benchmark) for the Research Lab.
