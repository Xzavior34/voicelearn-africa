# VoiceLearn Africa — Code-Switching Benchmark Methodology

## 1. Objective

The goal of the VoiceLearn Africa Benchmark is to empirically evaluate speech recognition models on **African educational code-switched speech** and measure how transcription accuracy directly influences **downstream agentic tutoring performance**.

```
Audio Input (Code-Switched)
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Sahara Whisper Gemini
    ▼    ▼    ▼
Transcripts (WER, CER, Code-Switch Preservation)
         │
         ▼
Educational Agent (Intent → Topic → Explanation → Practice → Misconception Assessment)
```

---

## 2. The Three Speech Models

| Model | Identifier | Architecture | Specialization |
|---|---|---|---|
| **Intron Sahara v2.5** | `sahara` | Streaming WebSocket (PCM16 16kHz) | African accents & code-switching (English, Pidgin, Yoruba, etc.) |
| **OpenAI Whisper Large v3** | `whisper-large-v3` | REST / Multipart Audio (`whisper-1`) | Global multilingual speech foundation model |
| **Google Gemini Audio** | `gemini` | REST / Audio Generative Content (`gemini-1.5-flash`) | Multimodal audio understanding foundation model |

---

## 3. Audio Normalization & Integrity

To ensure exact parity across all three models:
1. **Canonical Format:** Every audio sample is converted to **PCM16 Little-Endian, Mono, 16kHz WAV** (`lib/speech/audio-conversion.ts`).
2. **Cryptographic Hashing:** Every audio recording is fingerprinted with **SHA-256** to verify that all models receive the identical bitstream.
3. **Independent Ground Truth:** Reference transcripts are hand-reviewed human transcriptions, never derived from any model's hypothesis.

---

## 4. Dataset Composition (34 Samples)

The benchmark dataset (`lib/benchmark/dataset/dataset.ts`) spans 4 linguistic tiers across secondary Mathematics, Biology, Science, English Language, Physics, and Chemistry:

| Tier | Language Pair | Samples | Typical Utterance Example |
|---|---|---|---|
| **Tier 1: Standard English** | `en` | 6 | *"Why does a negative number times a negative number give a positive number?"* |
| **Tier 2: Nigerian Pidgin** | `pcm` | 6 | *"Why negative times negative dey give positive?"* |
| **Tier 3: English + Pidgin Code-Switching** | `en-pcm` | 14 | *"Teacher talk say photosynthesis dey use light energy, but why chlorophyll dey absorb light like that?"* |
| **Tier 4: English + Yoruba Code-Switching** | `en-yo` | 6 | *"Kí ló dé tí negative times negative fi ń fún wa ní positive?"* |
| **Downstream Follow-up Answers** | `en` / `en-pcm` | 2 | *"Twelve."* / *"I think say e go be positive twenty four because minus times minus na plus."* |

---

## 5. Quantitative Evaluation Metrics

### 5.1 Speech Recognition Metrics
- **Word Error Rate (WER):** Levenshtein edit distance over word tokens normalized by reference token count.
- **Character Error Rate (CER):** Levenshtein edit distance over characters normalized by reference length.
- **Exact Match:** Boolean string match after normalization.
- **Lexical Overlap:** Jaccard similarity over reference and hypothesis word sets.
- **Code-Switch Preservation:** Ratio of African dialect markers (Pidgin: *dey, wetin, fit, abeg, sabi, sef*, Yoruba: *kí, ló, dé, tí, ṣé*) preserved in the hypothesis transcript.
- **Latency (ms):** Round-trip execution time in milliseconds.

### 5.2 Downstream Agentic Tutoring Metrics
- **Intent Accuracy:** Does the transcript correctly trigger the intended learning need (`conceptual_question`, `procedural_question`, `clarification`, `practice_request`)?
- **Topic Accuracy:** Does the tutor correctly identify the secondary subject discipline?
- **Concept Match:** Does the transcript map to the exact target curriculum concept in `CURRICULUM` (`lib/tutor/curriculum.ts`)?
- **Tutor Success Rate:** Percentage of turns where the autonomous tutor successfully generates a grounded explanation, follow-up ladder question, and misconception diagnostic.

---

## 6. Auditability & Reproducibility

Run the health check and full benchmark locally:
```bash
# 1. Verify model credentials safely
npm run benchmark:health

# 2. Execute full 3-model benchmark
npm run benchmark:all

# 3. Run entire automated test suite
npm test
```

Generated reports are saved to:
- `benchmark/results/raw-results.json`
- `benchmark/results/summary.json`
- `benchmark/results/benchmark-report.md`
- `lib/benchmark/reports/asr-comparison-latest.json`
