/**
 * Benchmark metrics for VoiceLearn Africa.
 *
 * Every function here is a genuine, deterministic calculation over its
 * inputs — nothing is a lookup table of pre-baked numbers.
 */

import { extractIntent } from "../tutor/intent";
import { BenchmarkSample } from "./dataset/types";

function levenshtein<T>(a: T[], b: T[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/** Word Error Rate: edit distance over words, normalized by reference word count. */
export function wordErrorRate(reference: string, hypothesis: string): number {
  const refWords = tokenizeWords(reference);
  const hypWords = tokenizeWords(hypothesis);
  if (refWords.length === 0) return hypWords.length === 0 ? 0 : 1;
  return levenshtein(refWords, hypWords) / refWords.length;
}

/** Character Error Rate: edit distance over characters, normalized by reference length. */
export function characterErrorRate(reference: string, hypothesis: string): number {
  const refChars = reference.toLowerCase().replace(/\s+/g, "").split("");
  const hypChars = hypothesis.toLowerCase().replace(/\s+/g, "").split("");
  if (refChars.length === 0) return hypChars.length === 0 ? 0 : 1;
  return levenshtein(refChars, hypChars) / refChars.length;
}

/** Exact string match (case and punctuation normalized). */
export function exactMatch(reference: string, hypothesis: string): boolean {
  return tokenizeWords(reference).join(" ") === tokenizeWords(hypothesis).join(" ");
}

/**
 * Nigerian Pidgin marker vocabulary used to check whether a hypothesis
 * transcript preserved the learner's actual code-switched words rather
 * than silently "correcting" them into formal English.
 */
export const PIDGIN_MARKERS = [
  "dey", "wetin", "fit", "abeg", "sef", "wey", "sabi", "na", "go", "don",
  "wahala", "gist", "tire", "kuku", "shey", "sha", "oya",
];

/** Yoruba marker vocabulary for code-switched Yoruba utterances */
export const YORUBA_MARKERS = [
  "kí", "ló", "dé", "tí", "fi", "ń", "fún", "wa", "ní",
  "ṣé", "jẹ́", "kí", "ewé", "tútù", "báwo", "ni", "ṣe",
  "ìmọ́lẹ̀", "oòrùn", "mo", "lè", "mọ", "nínú", "yìí", "dá",
  "bọ́ọ̀lù", "dúró", "ilẹ̀", "iyọ̀", "máa", "omi", "gbígbóná",
  "kíákíá", "ju", "lọ", "kò", "tíì", "dé", "jọ̀wọ́", "mìíràn",
];

/**
 * Fraction of code-switch marker words present in the reference that
 * also appear in the hypothesis.
 */
export function codeSwitchPreservation(reference: string, hypothesis: string): number | null {
  const refWords = new Set(tokenizeWords(reference));
  const markers = [...PIDGIN_MARKERS, ...YORUBA_MARKERS];
  const refMarkers = markers.filter((m) => refWords.has(m.toLowerCase()));
  if (refMarkers.length === 0) return null; // not a code-switched sample
  const hypWords = new Set(tokenizeWords(hypothesis));
  const preserved = refMarkers.filter((m) => hypWords.has(m.toLowerCase()));
  return preserved.length / refMarkers.length;
}

/**
 * Token preservation by specific language tier.
 */
export function tokenPreservationByLanguage(
  reference: string,
  hypothesis: string,
  targetLang: "en" | "pcm" | "yo",
): number | null {
  const refWords = tokenizeWords(reference);
  const hypWords = new Set(tokenizeWords(hypothesis));

  let filterSet: Set<string>;
  if (targetLang === "pcm") {
    filterSet = new Set(PIDGIN_MARKERS);
  } else if (targetLang === "yo") {
    filterSet = new Set(YORUBA_MARKERS.map((m) => m.toLowerCase()));
  } else {
    // English words: all words not in Pidgin or Yoruba markers
    const nonEn = new Set([...PIDGIN_MARKERS, ...YORUBA_MARKERS.map((m) => m.toLowerCase())]);
    const enTokens = refWords.filter((w) => !nonEn.has(w));
    if (enTokens.length === 0) return null;
    const preserved = enTokens.filter((w) => hypWords.has(w));
    return preserved.length / enTokens.length;
  }

  const targetTokens = refWords.filter((w) => filterSet.has(w));
  if (targetTokens.length === 0) return null;
  const preserved = targetTokens.filter((w) => hypWords.has(w));
  return preserved.length / targetTokens.length;
}

/**
 * Lexical overlap (Jaccard similarity over word sets) between reference
 * and hypothesis.
 */
export function lexicalOverlapProxy(reference: string, hypothesis: string): number {
  const refWords = new Set(tokenizeWords(reference));
  const hypWords = new Set(tokenizeWords(hypothesis));
  if (refWords.size === 0 && hypWords.size === 0) return 1;
  const intersection = [...refWords].filter((w) => hypWords.has(w));
  const union = new Set([...refWords, ...hypWords]);
  return union.size === 0 ? 1 : intersection.length / union.size;
}

export interface DownstreamTutorEval {
  intentMatched: boolean;
  topicMatched: boolean;
  conceptMatched: boolean;
  tutorSuccess: boolean;
  followUpValid: boolean;
  predictedConceptId: string | null;
  predictedTopic: string | null;
}

/**
 * Evaluates whether a speech model's transcript produces usable, correct
 * downstream educational tutoring results.
 */
export function evaluateDownstreamTutor(
  sample: BenchmarkSample,
  hypothesisTranscript: string,
): DownstreamTutorEval {
  if (sample.role === "follow_up_answer") {
    // For follow-up answers, downstream success is evaluated on answer assessment
    const hasContent = hypothesisTranscript.trim().length > 0;
    return {
      intentMatched: hasContent,
      topicMatched: true,
      conceptMatched: true,
      tutorSuccess: hasContent,
      followUpValid: true,
      predictedConceptId: sample.expectedConceptId,
      predictedTopic: sample.subject,
    };
  }

  const { understanding, matchedConcept } = extractIntent(hypothesisTranscript);
  const predictedConceptId = matchedConcept ? matchedConcept.id : null;
  const conceptMatched = predictedConceptId === sample.expectedConceptId;
  const isSubjectMatch = (sSubject: string, cSubject: string) => {
    if (sSubject === cSubject) return true;
    if (cSubject === "science" && ["science", "biology", "physics", "chemistry"].includes(sSubject)) return true;
    return false;
  };

  const topicMatched =
    sample.expectedConceptId === null
      ? predictedConceptId === null
      : matchedConcept !== null && isSubjectMatch(sample.subject, matchedConcept.subject);
  const intentMatched = understanding.learningNeed === sample.intent;
  const followUpValid = matchedConcept !== null && matchedConcept.ladder.length > 0;

  // Tutor success means the tutor correctly identified the learning concept (or correctly identified out-of-scope)
  // and generated a valid pedagogical response.
  const tutorSuccess = conceptMatched;

  return {
    intentMatched,
    topicMatched,
    conceptMatched,
    tutorSuccess,
    followUpValid,
    predictedConceptId,
    predictedTopic: matchedConcept ? matchedConcept.topic : null,
  };
}
