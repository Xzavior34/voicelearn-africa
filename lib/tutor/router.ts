import { CURRICULUM, Concept, REGEX_DETECTORS } from "./curriculum";

/**
 * Structured curriculum routing.
 *
 * This sits in front of the existing curriculum matching in
 * curriculum.ts, which already does exact/alias substring matching
 * plus a regex fallback. It adds two things on top, both conservative
 * by design:
 *
 * 1. Normalization + Nigerian Pidgin question-frame stripping, so a
 *    transcript like "Abeg wetin be photosynthesis?" is reduced to a
 *    core phrase before matching, the same way a person would mentally
 *    discard "Abeg" and "wetin be" as scaffolding around the real
 *    question.
 * 2. A narrow fuzzy tier restricted to the curriculum's own vocabulary
 *    (words drawn from the existing triggerPhrases, not a general
 *    dictionary), for realistic ASR corruption such as "photosintesis".
 *    This never compares against arbitrary words, and never matches
 *    when two different concepts are equally close (ambiguous cases
 *    are left unmatched rather than guessed at).
 *
 * findConceptByTranscript() in curriculum.ts is preserved with its
 * existing behavior and signature for every existing caller. This
 * module adds routeQuestion() as a superset for callers that want the
 * richer result (confidence, which tier matched, the normalized
 * query) without requiring any existing call site to change.
 */

export type MatchMethod = "exact" | "normalized" | "fuzzy" | null;

export interface RoutingResult {
  matched: boolean;
  topicId: string | null;
  /** Genuinely computed from which tier matched, not a fabricated number. */
  confidence: number | null;
  matchMethod: MatchMethod;
  normalizedQuery: string;
  originalQuery: string;
}

// ---- 1. General normalization -------------------------------------------

/**
 * Lowercases, collapses whitespace, and strips punctuation that never
 * carries meaning for curriculum matching. Keeps apostrophes (so
 * "what's" and "affect's" style contractions survive) and hyphens
 * within words (so "photo-synthesis" is not mangled before the alias
 * check runs). This does not rewrite any words, only cleans formatting.
 */
export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?!.,;:"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- 2. Nigerian Pidgin / informal question-frame stripping -------------

/**
 * Each pattern captures the "core topic phrase" out of a common
 * educational question frame, discarding only the scaffolding words
 * around it, never rewriting the topic phrase itself. Order matters:
 * more specific frames are listed before more general ones.
 */
const QUESTION_FRAME_PATTERNS: RegExp[] = [
  // "na wetin X be" -> X
  /^na\s+wetin\s+(.+?)\s+be$/i,
  // "X na wetin" -> X
  /^(.+?)\s+na\s+wetin$/i,
  // "wetin be X" -> X
  /^(?:abeg\s+)?wetin\s+be\s+(.+)$/i,
  // "wetin X mean" -> X
  /^wetin\s+(.+?)\s+mean$/i,
  // "wetin X dey do" -> X
  /^wetin\s+(.+?)\s+dey\s+do$/i,
  // "wetin cause X" -> X
  /^wetin\s+cause\s+(.+)$/i,
  // "how X take work" -> X
  /^how\s+(.+?)\s+take\s+work$/i,
  // "abeg explain X" / "abeg teach me X" / "abeg teach me about X"
  /^abeg\s+(?:explain|teach me(?: about)?)\s+(.+)$/i,
  // "make you explain X"
  /^make you explain\s+(.+)$/i,
  // "why X dey happen" -> X
  /^why\s+(.+?)\s+dey\s+happen$/i,
  // "why X important" -> X
  /^why\s+(.+?)\s+important$/i,
  // "why e be like that" has no recoverable topic phrase (pronoun-only)
  // and is deliberately not included here — see module doc.
];

/**
 * Strips a single recognized question frame, if any, and returns the
 * core phrase. Returns the input unchanged if no frame matches, so
 * callers can always run matching against the result. This never
 * resolves bare pronoun references ("explain am", "how e take work")
 * to a specific topic; those are intentionally left to the existing
 * active-topic continuation logic in session.ts, which has the
 * conversation context this function does not.
 */
export function stripQuestionFraming(normalized: string): string {
  for (const pattern of QUESTION_FRAME_PATTERNS) {
    const match = normalized.match(pattern);
    if (match && match[1] && match[1].trim().length > 0) {
      return match[1].trim();
    }
  }
  return normalized;
}

// ---- 3. Conservative fuzzy tier, restricted to curriculum vocabulary ----

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(
        Math.min(
          currentRow[j - 1] + 1, // insertion
          prevRow[j] + 1, // deletion
          prevRow[j - 1] + cost, // substitution
        ),
      );
    }
    prevRow = currentRow;
  }
  return prevRow[b.length];
}

/** Allowed edit distance scales conservatively with word length, so
 * short words are never fuzzy-matched loosely enough to collide with
 * an unrelated word. */
function maxAllowedDistance(wordLength: number): number {
  if (wordLength >= 9) return 2;
  if (wordLength >= 6) return 1;
  return 0; // words shorter than 6 letters require an exact/alias match, not fuzzy
}

interface VocabEntry {
  word: string;
  conceptId: string;
}

/**
 * Generic instructional/frame words that appear inside curriculum
 * triggerPhrases as connective scaffolding ("explain X", "define X",
 * "central idea") rather than as the actual distinctive subject-matter
 * term. These must never become fuzzy-match anchors on their own, or a
 * completely unrelated question that happens to use an everyday verb
 * like "explain" would coincidentally match whichever concept's
 * triggerPhrases happened to contain that same generic word.
 */
const VOCAB_STOPWORDS = new Set([
  "explain",
  "define",
  "identify",
  "important",
  "difference",
  "eventually",
  "because",
  "happen",
  "happens",
  "understand",
  "central",
  "distinguish",
  "distinguishing",
]);

/**
 * Vocabulary is derived from the curriculum's own triggerPhrases, not
 * a separately hand-maintained list, so it can never drift out of
 * sync with the actual concepts. Only words of 6+ letters are used as
 * fuzzy anchors, since shorter words are too easy to collide with by
 * coincidence, and generic instructional words are excluded via
 * VOCAB_STOPWORDS for the same reason.
 */
function buildVocabulary(): VocabEntry[] {
  const entries: VocabEntry[] = [];
  const seen = new Set<string>();
  for (const concept of CURRICULUM) {
    for (const phrase of concept.triggerPhrases) {
      for (const word of phrase.split(/\s+/)) {
        const cleaned = word.replace(/[^a-z0-9]/gi, "").toLowerCase();
        if (cleaned.length < 6) continue;
        // Purely numeric fragments ("10" from "photos 10 cies") are not
        // useful vocabulary anchors.
        if (/^\d+$/.test(cleaned)) continue;
        if (VOCAB_STOPWORDS.has(cleaned)) continue;
        const key = `${concept.id}:${cleaned}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push({ word: cleaned, conceptId: concept.id });
      }
    }
  }
  return entries;
}

let vocabularyCache: VocabEntry[] | null = null;
function getVocabulary(): VocabEntry[] {
  if (!vocabularyCache) vocabularyCache = buildVocabulary();
  return vocabularyCache;
}

/**
 * Fuzzy-matches each token in the phrase against the curriculum
 * vocabulary. Returns a concept id only if exactly one concept is the
 * closest match across all tokens, within the allowed distance for
 * that word's length. If two different concepts tie for the best
 * distance, this deliberately returns null rather than guessing,
 * per the confidence/safety rules for this router.
 */
function fuzzyMatchConceptId(phrase: string): string | null {
  const tokens = phrase
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/gi, "").toLowerCase())
    .filter((t) => t.length >= 6 && !/^\d+$/.test(t));

  if (tokens.length === 0) return null;

  const vocabulary = getVocabulary();
  let bestDistance = Infinity;
  let bestConceptIds = new Set<string>();

  for (const token of tokens) {
    for (const entry of vocabulary) {
      const distance = levenshteinDistance(token, entry.word);
      if (distance > maxAllowedDistance(entry.word.length)) continue;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestConceptIds = new Set([entry.conceptId]);
      } else if (distance === bestDistance) {
        bestConceptIds.add(entry.conceptId);
      }
    }
  }

  if (bestConceptIds.size === 1) {
    return [...bestConceptIds][0];
  }
  return null; // no match, or ambiguous between concepts, do not guess
}

// ---- 4. Exact/alias substring + regex tier (delegates to curriculum.ts) -

function exactOrAliasMatch(text: string): Concept | null {
  const lower = text.toLowerCase();
  for (const concept of CURRICULUM) {
    if (concept.triggerPhrases.some((phrase) => lower.includes(phrase))) {
      return concept;
    }
  }
  return null;
}

function regexDetectorMatch(text: string): Concept | null {
  for (const concept of CURRICULUM) {
    const detector = REGEX_DETECTORS[concept.id];
    if (detector && detector.test(text)) return concept;
  }
  return null;
}

// ---- 5. Public entry point ------------------------------------------------

/**
 * Routes a transcript to a curriculum concept with an explicit
 * confidence tier, trying progressively looser matching strategies and
 * stopping at the first one that succeeds:
 *
 *   1. exact/alias substring match on the raw (lowercased) transcript
 *   2. exact/alias substring match after normalization and Pidgin
 *      question-frame stripping
 *   3. the existing per-concept regex fallback detectors
 *   4. conservative fuzzy match against curriculum vocabulary only,
 *      run on the frame-stripped phrase
 *
 * Never falls back to guessing: if nothing above succeeds, or the
 * fuzzy tier is ambiguous between concepts, matched is false and the
 * caller should show the existing "not in curriculum" fallback.
 */
export function routeQuestion(transcript: string): RoutingResult {
  const originalQuery = transcript;
  const normalizedQuery = normalizeTranscript(transcript);

  const exact = exactOrAliasMatch(transcript);
  if (exact) {
    return {
      matched: true,
      topicId: exact.id,
      confidence: 0.95,
      matchMethod: "exact",
      normalizedQuery,
      originalQuery,
    };
  }

  const stripped = stripQuestionFraming(normalizedQuery);
  const normalizedMatch = exactOrAliasMatch(stripped) || exactOrAliasMatch(normalizedQuery);
  if (normalizedMatch) {
    return {
      matched: true,
      topicId: normalizedMatch.id,
      confidence: 0.85,
      matchMethod: "normalized",
      normalizedQuery,
      originalQuery,
    };
  }

  const regexMatch = regexDetectorMatch(transcript) || regexDetectorMatch(stripped);
  if (regexMatch) {
    return {
      matched: true,
      topicId: regexMatch.id,
      confidence: 0.8,
      matchMethod: "normalized",
      normalizedQuery,
      originalQuery,
    };
  }

  const fuzzyConceptId = fuzzyMatchConceptId(stripped);
  if (fuzzyConceptId) {
    return {
      matched: true,
      topicId: fuzzyConceptId,
      confidence: 0.65,
      matchMethod: "fuzzy",
      normalizedQuery,
      originalQuery,
    };
  }

  return {
    matched: false,
    topicId: null,
    confidence: null,
    matchMethod: null,
    normalizedQuery,
    originalQuery,
  };
}
