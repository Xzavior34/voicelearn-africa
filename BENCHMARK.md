# VoiceLearn Africa — Code-Switching Benchmark Methodology

## 1. Objective

The goal of the VoiceLearn Africa Benchmark is to empirically evaluate speech recognition models on **African educational code-switched speech** and measure how transcription accuracy directly influences **downstream agentic tutoring performance**.

```
Audio Input (Code-Switched)
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Sahara Whisper Wav2Vec2
 (Remote) (Local) (Local)
    ▼    ▼    ▼
Transcripts (WER, CER, Code-Switch WER, Lexical Overlap)
         │
         ▼
Educational Agent (Intent → Concept Extraction → Adaptive Explanation → Practice → Misconception Assessment)
         │
         ▼
Speech-to-Learning Success Rate
```

---

## 2. The Three Speech Models

| Model | Identifier | Runtime | License | Model Purpose |
|---|---|---|---|---|
| **Intron Sahara v2.5** | `sahara` | Remote WebSocket API | Commercial | Challenge-required African code-switching specialist (English, Pidgin, Yoruba) |
| **OpenAI Whisper Large v3** | `whisper-large-v3` | Local Open-Weights | [Apache-2.0](https://huggingface.co/openai/whisper-large-v3) | Open-source global multilingual baseline (Zero API keys) |
| **Meta Wav2Vec2 Large 960h** | `wav2vec2-large-960h` | Local Open-Weights | [Apache-2.0](https://huggingface.co/facebook/wav2vec2-large-960h) | Independent English LibriSpeech baseline (~1.26 GB) to evaluate general ASR breakdown |

> **Fair Comparison Notice:** Sahara is evaluated as the challenge-specific speech model. Whisper Large v3 and Wav2Vec2 Large 960h are independently run local open-weight baselines. All models receive the same normalized audio (16kHz mono PCM16, SHA-256 verified) and are evaluated against the same human-reviewed references.

---

## 3. Audio Normalization & Cryptographic Integrity

To ensure exact parity across all three models:
1. **Canonical Format:** Every audio sample is converted to **PCM16 Little-Endian, Mono, 16kHz WAV** (`lib/speech/audio-conversion.ts`).
2. **Cryptographic Hashing:** Every audio recording is fingerprinted with **SHA-256** to verify that all models receive the identical bitstream.
3. **Independent Ground Truth:** Reference transcripts are hand-reviewed human transcriptions, never derived from any model's hypothesis.

---

## 4. Dataset Composition (34 Samples)

The benchmark dataset (`lib/benchmark/dataset/dataset.ts` and `benchmark/dataset/samples.json`) spans 4 linguistic tiers across secondary Mathematics, Biology, Science, English Language, Physics, and Chemistry:

| Tier | Language Pair | Samples | Typical Utterance Example |
|---|---|---|---|
| **Tier 1: Standard English** | `en` | 6 | *"Why does a negative number times a negative number give a positive number?"* |
| **Tier 2: Nigerian Pidgin** | `pcm` | 6 | *"Why negative times negative dey give positive?"* |
| **Tier 3: English + Pidgin Code-Switching** | `en-pcm` | 14 | *"Teacher talk say photosynthesis dey use light energy, but why chlorophyll dey absorb light like that?"* |
| **Tier 4: English + Yoruba Code-Switching** | `en-yo` | 6 | *"Bawo ni photosynthesis se n sele ninu ewe?"* |
| **Downstream Follow-up Answers** | `en` / `en-pcm` | 2 | *"Twelve."* / *"I think say e go be positive twenty four because minus times minus na plus."* |

---

## 5. Quantitative Evaluation Metrics

### 5.1 Speech Recognition Metrics
- **Word Error Rate (WER):** Levenshtein edit distance over word tokens normalized by reference token count.
- **Character Error Rate (CER):** Levenshtein edit distance over characters normalized by reference length.
- **Code-Switch WER (CS-WER):** WER measured specifically on intra-sentential code-switched subsets (Pidgin, Yoruba).
- **Exact Match:** Boolean string match after normalization.
- **Lexical Overlap:** Jaccard similarity over reference and hypothesis word sets.
- **Code-Switch Marker Preservation:** Ratio of African dialect markers (Pidgin: *dey, wetin, fit, abeg, sabi, sef*, Yoruba: *bawo, kilo, sele, ninu, ewe*) preserved in the hypothesis transcript.
- **Warm Inference Latency (ms):** Model inference latency separated from cold-start model weight loading.

### 5.2 Downstream Agentic Tutoring Metrics
- **Speech-to-Learning Success:** Correct transcription $\wedge$ correct intent $\wedge$ valid curriculum concept $\wedge$ grounded Socratic explanation.
- **Concept Extraction Accuracy:** Does the transcript map to the exact target curriculum concept without LLM hallucination?
- **Topic Accuracy:** Does the tutor correctly route to the secondary school subject discipline?
- **Tutor Success Rate:** Percentage of turns where the autonomous tutor successfully generates a grounded explanation, follow-up ladder question, and misconception diagnostic.

---

## 6. Auditability & Reproducibility

```bash
# 1. Verify model health
npm run benchmark:health

# 2. Execute full 3-model benchmark
npm run benchmark
```
