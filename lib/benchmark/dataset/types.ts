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
  "english_pidgin",
  "educational_code_switching",
  "fast_speech",
  "noisy_environment",
  "subject_vocabulary",
  "out_of_curriculum",
]);
export type SampleCategory = z.infer<typeof SampleCategorySchema>;

export const BenchmarkSampleSchema = z.object({
  id: z.string(),
  referenceTranscript: z.string(),
  languagePair: z.enum(["en", "en-pcm", "en-yo"]),
  domain: z.literal("education"),
  subject: z.enum(["mathematics", "science", "english", "general"]),
  category: SampleCategorySchema,
  intent: z.enum(["conceptual_question", "procedural_question", "clarification", "practice_request"]),
  /** id of the CURRICULUM concept this SHOULD map to, or null if intentionally out of curriculum scope. */
  expectedConceptId: z.string().nullable(),
  /** Declared, not measured — no device/mic was used to produce this text sample. */
  noiseCondition: z.enum(["quiet", "moderate_background", "noisy"]),
  deviceType: z.enum(["smartphone", "unspecified"]),
  /**
   * Whether this sample is a learner OPENING a topic (what the intent/
   * topic-extraction baseline measures) or a learner ANSWERING a
   * follow-up question (what the assessment module is tested against
   * separately in __tests__/assessment.test.ts). Mixing the two into
   * one accuracy number would be methodologically invalid — a bare
   * answer like "Twelve." has no topic-identifying content of its own.
   */
  role: z.enum(["initial_question", "follow_up_answer"]),
  /** Path to recorded audio file (WAV/WebM) on disk, or null if pending recording */
  audioFilePath: z.string().nullable().optional(),
  /** Speaker country (e.g. "Nigeria") */
  speakerCountry: z.string().nullable().optional(),
  /** Speaker accent / dialect */
  speakerAccent: z.string().nullable().optional(),
  /** Physical recording device used */
  deviceUsed: z.string().nullable().optional(),
  /** Confirms informed consent from consenting adult speaker */
  consentObtained: z.boolean().optional(),
});
export type BenchmarkSample = z.infer<typeof BenchmarkSampleSchema>;
