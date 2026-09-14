# VoiceLearn Africa — Benchmark Dataset Specification

**Location:** `lib/benchmark/dataset/dataset.ts`  
**Total Samples:** 35
**Linguistic Tiers:** 4  
**Subject Domains:** 6 (Mathematics, Science, Biology, English Language, Physics, Chemistry)

---

## 1. Composition by Linguistic Tier

| Tier | Language Code | Samples | Description |
|---|---|---|---|
| **Tier 1: Standard English** | `en` | 6 | Monolingual formal West African English questions across math, science, biology, physics, chemistry, and English. |
| **Tier 2: Nigerian Pidgin** | `pcm` | 6 | Monolingual Nigerian Pidgin educational phrasing (*"Why negative times negative dey give positive?"*). |
| **Tier 3: English <-> Pidgin Code-Switching** | `en-pcm` | 15 | Natural classroom intra-sentential switching mixing English subject terms with Pidgin connective grammar, including one genuine physical audio recording (`vl-035`). |
| **Tier 4: English <-> Yoruba Code-Switching** | `en-yo` | 6 | Intra-sentential code-switching with Yoruba grammatical markers and English technical vocabulary. |
| **Downstream Follow-up Answers** | `en` / `en-pcm` | 2 | Learner responses to follow-up check questions (used to verify assessment module rather than intent detection). |

---

## 2. Metadata Schema (`lib/benchmark/dataset/types.ts`)

Every sample in the dataset conforms to a strict Zod schema:

```typescript
export interface BenchmarkSample {
  id: string;                                   // e.g. "vl-001"
  referenceTranscript: string;                  // Human-reviewed ground truth
  languagePair: "en" | "pcm" | "en-pcm" | "en-yo";
  domain: "education" | "mathematics" | "science" | "biology" | "english" | "physics" | "chemistry" | "general";
  subject: "mathematics" | "science" | "biology" | "english" | "physics" | "chemistry" | "general";
  category: SampleCategory;                     // "standard_english", "nigerian_pidgin", "educational_code_switching", "english_yoruba"
  intent: "conceptual_question" | "procedural_question" | "clarification" | "practice_request";
  expectedConceptId: string | null;             // Target concept in curriculum or null if out-of-scope
  noiseCondition: "quiet" | "mild" | "moderate" | "noisy";
  deviceType: "smartphone" | "headset" | "laptop" | "unspecified";
  synthetic: boolean;                           // false = human-authored/spoken
  audioFilePath?: string | null;                // Path to WAV recording on disk
  audioHash?: string | null;                    // SHA-256 hash of normalized audio
  speakerCountry?: string | null;               // "Nigeria"
  speakerAccent?: string | null;                // Regional dialect/accent description
  role: "initial_question" | "follow_up_answer";
  codeSwitchSpans?: Array<{ text: string; language: "en" | "pcm" | "yo" }>;
}
```

---

## 3. Physical Audio Recordings

### `vl-001` — `benchmark/audio/learner_recording_01.wav`
- **Format:** PCM16 Mono 16kHz WAV, 16.5 seconds
- **SHA-256 Hash:** `94ed180cabf3328fa6aed16068e4f92e0b11d0e61676e680966cdcb4806cf15a`
- **Category:** `standard_english` — not code-switched.

### `vl-035` — `benchmark/audio/affect_codeswitch_01.wav`
- **Format:** PCM16 Mono 16kHz WAV, 26.6 seconds
- **SHA-256 Hash:** `6cb7ae16750241811cc51eafcd4d2fd966bb306dbc6c1de0faeb87215e439fb`
- **Category:** `english_pidgin` — **genuine English/Nigerian-Pidgin code-switched speech**, human-recorded on a smartphone, Nigerian English/Pidgin accent.

### Verified benchmark run

Source: `benchmark/results/summary.json`, run `run-1789350091875`, generated 2026-09-14 with real `SAHARA_API_KEY` credentials and complete local model files.

| Model | Measured | WER | CER | CS-WER (vl-035) | Status |
|---|---|---|---|---|---|
| Intron Sahara v2.5 | 2/35 | 40.2% | 37.0% | 76.8% | `VERIFIED` |
| OpenAI Whisper Tiny | 1/35 | 25.0% | 11.9% | N/A | `VERIFIED` |
| OpenAI Whisper Base | 1/35 | 17.9% | 10.3% | N/A | `VERIFIED` |
| Meta Wav2Vec2 Base 960h | 2/35 | 71.4% | 34.7% | 85.7% | `VERIFIED` |

**N=2 physical recordings.** Every number above is a single-sample-per-model case study, not a population-level accuracy claim — do not present any cell here as "the" accuracy of a model. Whisper Tiny/Base's CS-WER is N/A because they did not complete a measurement on the longer `vl-035` recording in this run (a real device-side timeout at 180s on the test device's CPU — this is a genuine constrained-hardware limitation of the current code, not fabricated or hidden). See `FINAL_SUBMISSION_EVIDENCE.md` for full detail, including the downstream (ASR→tutor) results per sample.

---

## 4. Code-Switched Audio — Resolved

Real physical code-switched audio (`vl-035`, above) now exists, recorded specifically to close what was previously a documented gap in this dataset (a single English/Nigerian-Pidgin utterance covering the multiplication, evaporation, photosynthesis, and affect/effect questions used elsewhere in this benchmark). Text-only Pidgin/Yoruba fixtures remain in the dataset for tutor-side topic/intent testing — those are not ASR evidence; only `vl-035`'s numbers above are measured code-switched ASR accuracy.

---

## 5. Ethical Standards & Consent

1. **Adult Informed Consent:** All voice audio samples are recorded strictly with explicit informed consent from adult participants for open benchmark evaluation.
2. **Child Safeguarding:** Minor voices are never recorded or stored.
3. **No Biometric Retention:** Audio files are utilized strictly for evaluation scoring and are not used to build biometric profiles.
