# VoiceLearn Africa — Benchmark Dataset Specification

**Location:** `lib/benchmark/dataset/dataset.ts`  
**Total Samples:** 34  
**Linguistic Tiers:** 4  
**Subject Domains:** 6 (Mathematics, Science, Biology, English Language, Physics, Chemistry)

---

## 1. Composition by Linguistic Tier

| Tier | Language Code | Samples | Description |
|---|---|---|---|
| **Tier 1: Standard English** | `en` | 6 | Monolingual formal West African English questions across math, science, biology, physics, chemistry, and English. |
| **Tier 2: Nigerian Pidgin** | `pcm` | 6 | Monolingual Nigerian Pidgin educational phrasing (*"Why negative times negative dey give positive?"*). |
| **Tier 3: English <-> Pidgin Code-Switching** | `en-pcm` | 14 | Natural classroom intra-sentential switching mixing English subject terms with Pidgin connective grammar. |
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

- **File on Disk:** `benchmark/audio/learner_recording_01.wav`
- **Format:** PCM16 Mono 16kHz WAV
- **Duration:** 16.5 seconds
- **SHA-256 Hash:** `94ed180cabf3328fa6aed16068e4f92e0b11d0e61676e680966cdcb4806cf15a`
- **Live Evaluated Engine:** Intron Sahara v2.5 (`sahara`)
- **Measured WER:** 7.1%
- **Measured CER:** 6.3%
- **Downstream Tutor Concept Match:** 100% (`signed-multiplication`)

---

## 4. Ethical Standards & Consent

1. **Adult Informed Consent:** All voice audio samples are recorded strictly with explicit informed consent from adult participants for open benchmark evaluation.
2. **Child Safeguarding:** Minor voices are never recorded or stored.
3. **No Biometric Retention:** Audio files are utilized strictly for evaluation scoring and are not used to build biometric profiles.
