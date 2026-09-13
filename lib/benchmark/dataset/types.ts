import { z } from "zod";

/**
 * IMPORTANT — READ THIS BEFORE TRUSTING ANYTHING IN dataset.ts:
 *
 * These are TEXT-ONLY, hand-authored development samples. No audio
 * recordings — human, consented, or synthetic — exist for this dataset
 * yet. `referenceTranscript` is what a learner would plausibly say;
 * there is no corresponding audio file. This dataset is sufficient to:
 *   (a) unit-test the metrics functions (WER/CER/etc.) against known
 *       reference/hypothesis text pairs, and
 *   (b) measure a "ground-truth transcript" baseline for the tutor's
 *       intent/topic extraction accuracy (i.e. "if ASR were perfect,
 *       how well does the downstream educational reasoning perform?").
 * It is NOT sufficient to benchmark real ASR/Sahara accuracy — that
 * requires real audio and is marked REQUIRES_API_ACCESS /
 * LOCAL DEVICE TEST REQUIRED throughout the benchmark reports.
 */

export const SampleCategorySchema = z.enum([
  "standard_english",
  "nigerian_pidgin",
  "english_pidgin",
  "educational_code_switching",
  "english_yoruba",
  "fast_speech",
  "noisy_environment",
  "subject_vocabulary",
  "out_of_curriculum",
]);
export type SampleCategory = z.infer<typeof SampleCategorySchema>;

export const CodeSwitchSpanSchema = z.object({
  text: z.string(),
  language: z.enum(["en", "pcm", "yo"]),
});
export type CodeSwitchSpan = z.infer<typeof CodeSwitchSpanSchema>;

export const BenchmarkSampleSchema = z.object({
  id: z.string(),
  referenceTranscript: z.string(),
  languagePair: z.enum(["en", "pcm", "en-pcm", "en-yo"]),
  domain: z.enum(["education", "mathematics", "science", "biology", "english", "physics", "chemistry", "general"]).default("education"),
  subject: z.enum(["mathematics", "science", "biology", "english", "physics", "chemistry", "general"]),
  category: SampleCategorySchema,
  intent: z.enum(["conceptual_question", "procedural_question", "clarification", "practice_request"]),
  /** id of the CURRICULUM concept this SHOULD map to, or null if intentionally out of curriculum scope. */
  expectedConceptId: z.string().nullable(),
  /** Acoustic/environment condition */
  noiseCondition: z.enum(["quiet", "mild", "moderate", "noisy", "moderate_background"]).default("quiet"),
  deviceType: z.enum(["smartphone", "headset", "laptop", "unspecified"]).default("smartphone"),
  /** Whether the sample was generated synthetically or recorded from human speech */
  synthetic: z.boolean().default(false),
  /** Path to recorded audio file (WAV/WebM) on disk, or null if pending recording */
  audioFilePath: z.string().nullable().optional(),
  /** SHA-256 hash of normalized audio */
  audioHash: z.string().nullable().optional(),
  /** Speaker country (e.g. "Nigeria") */
  speakerCountry: z.string().nullable().optional(),
  /** Speaker accent / dialect */
  speakerAccent: z.string().nullable().optional(),
  /** Physical recording device used */
  deviceUsed: z.string().nullable().optional(),
  /** Confirms informed consent from consenting adult speaker */
  consentObtained: z.boolean().optional(),
  /**
   * Whether this sample is a learner OPENING a topic (what the intent/
   * topic-extraction baseline measures) or a learner ANSWERING a
   * follow-up question.
   */
  role: z.enum(["initial_question", "follow_up_answer"]).default("initial_question"),
  /** Annotated language spans for token-level language attribution */
  codeSwitchSpans: z.array(CodeSwitchSpanSchema).optional(),
});
export type BenchmarkSample = z.infer<typeof BenchmarkSampleSchema>;

