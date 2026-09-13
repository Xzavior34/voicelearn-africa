/**
 * Benchmark metrics.
 *
 * Every function here is a genuine, deterministic calculation over its
 * inputs — nothing is a lookup table of pre-baked numbers. Each is
 * unit-tested against known reference/hypothesis pairs with a
 * hand-computed expected result (see __tests__/metrics.test.ts).
 */

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

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .trim()
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

/**
 * Nigerian Pidgin marker vocabulary used to check whether a hypothesis
 * transcript preserved the learner's actual code-switched words rather
 * than silently "correcting" them into formal English. This is a
 * proxy, not a linguistic ground truth — documented as such in
 * BENCHMARK_METHODOLOGY.md.
 */
export const PIDGIN_MARKERS = [
  "dey", "wetin", "fit", "abeg", "sef", "wey", "sabi", "na", "go", "don",
  "wahala", "gist", "tire",
];

/**
 * Fraction of code-switch marker words present in the reference that
 * also appear in the hypothesis. 1.0 means every Pidgin marker word the
 * learner actually said survived transcription; a model that "cleans
 * up" Pidgin into formal English will score low here even if its WER
 * looks reasonable.
 */
export function codeSwitchPreservation(reference: string, hypothesis: string): number | null {
  const refWords = new Set(tokenizeWords(reference));
  const refMarkers = PIDGIN_MARKERS.filter((m) => refWords.has(m));
  if (refMarkers.length === 0) return null; // not a code-switched sample
  const hypWords = new Set(tokenizeWords(hypothesis));
  const preserved = refMarkers.filter((m) => hypWords.has(m));
  return preserved.length / refMarkers.length;
}

/**
 * Lexical overlap (Jaccard similarity over word sets) between reference
 * and hypothesis. Labeled explicitly as a LEXICAL OVERLAP PROXY, not
 * true semantic similarity — a real semantic-preservation metric would
 * need embeddings or human judgment, neither of which is available in
 * this environment without an external model call.
 */
export function lexicalOverlapProxy(reference: string, hypothesis: string): number {
  const refWords = new Set(tokenizeWords(reference));
  const hypWords = new Set(tokenizeWords(hypothesis));
  if (refWords.size === 0 && hypWords.size === 0) return 1;
  const intersection = [...refWords].filter((w) => hypWords.has(w));
  const union = new Set([...refWords, ...hypWords]);
  return union.size === 0 ? 1 : intersection.length / union.size;
}
