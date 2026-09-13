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
- **Category:** `standard_english` — **this recording is NOT code-switched.**
- **Live Evaluated Engine:** Intron Sahara v2.5 (`sahara`)
- **Historical measurement (prior authenticated session, not reproducible in every environment):** this repository's own docs disagree with each other on the exact figure — some (`BENCHMARK_RESULTS.md`, `DEMO_SCRIPT.md`, `FINAL_PRODUCT_AUDIT.md`, `FINAL_SUBMISSION_READINESS.md`) cite WER 3.6% / CER 0.8%; an earlier generated `benchmark/results/summary.json` (since deleted for being stale and inconsistent with the current model configuration) showed WER 7.1% / CER 6.3% for the same file. Both came from real Sahara API calls at different times — Sahara's output is not perfectly deterministic run-to-run, and this repo's docs were not kept in sync across runs. **Do not cite a specific number in the submission until you've re-run `npm run benchmark` with a real `SAHARA_API_KEY` and taken the number from that fresh, single, current run.**

---

## 4. PENDING HUMAN RECORDING — genuine code-switched audio

**As of this writing, zero physical code-switched audio recordings exist.** All Pidgin/Yoruba/code-switching dataset entries are text-only fixtures (see the warning at the top of `lib/benchmark/dataset/types.ts`). The challenge asks for code-switched audio benchmarking specifically, so this is a real evidence gap, not a cosmetic one.

**Action required from a human, not from an AI session:** record one short, genuine English/Nigerian-Pidgin sample yourself. Suggested content (adjust wording naturally, don't read it robotically):

> "I understand say negative times negative dey give positive, but why exactly e dey work like that?"

Steps:
1. Record it any way that's convenient — a voice memo app, or the existing microphone capture already built into `/learn`.
2. Save it as a 16kHz mono PCM16 WAV (or note its actual format/sample rate if different — the runner reports what it actually reads).
3. Place the file at `benchmark/audio/learner_recording_02_codeswitch.wav`.
4. Add a corresponding entry to `RAW_SAMPLES` in `lib/benchmark/dataset/dataset.ts` with `audioFilePath` pointing at that file, `category: "educational_code_switching"` (or `nigerian_pidgin`, whichever fits what you actually said), and a `referenceTranscript` that's an honest transcript of what you actually said.
5. Re-run `npm run benchmark` (with `SAHARA_API_KEY` set, and the two local models' files complete) to get a real, measured code-switched result.

**Until this is done, this project's code-switching evidence is text-fixture-only. Do not describe it as audio evidence in the submission.**

---

## 5. Ethical Standards & Consent

1. **Adult Informed Consent:** All voice audio samples are recorded strictly with explicit informed consent from adult participants for open benchmark evaluation.
2. **Child Safeguarding:** Minor voices are never recorded or stored.
3. **No Biometric Retention:** Audio files are utilized strictly for evaluation scoring and are not used to build biometric profiles.
