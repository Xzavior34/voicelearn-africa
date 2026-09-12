/**
 * Curriculum knowledge base.
 *
 * This is intentionally small and hand-authored for the MVP (per the
 * brief: "depth beats breadth"). Each concept has a ladder of
 * follow-up questions at increasing difficulty, plus known
 * misconceptions so assessment can identify *why* an answer is wrong,
 * not just that it is wrong.
 *
 * Keyword matching here is deliberately simple substring/pattern
 * matching, not an LLM classifier — it is fully deterministic, has no
 * external dependency, and is exhaustively unit-tested. An LLM-backed
 * intent classifier is a reasonable future upgrade (see README ->
 * Future Work) but is out of scope for what can be verified in this
 * environment right now.
 */

export type Subject = "mathematics" | "science" | "english";

export interface DifficultyStep {
  difficulty: number; // 1 (easiest) - 5 (hardest)
  question: string;
  expectedAnswer: string;
  /** Alternate acceptable phrasings/numerals for the expected answer. */
  acceptableAnswers: string[];
}

export interface Concept {
  id: string;
  subject: Subject;
  topic: string;
  concept: string;
  /** Substrings/keywords (case-insensitive) that signal this concept, including Pidgin phrasing. */
  triggerPhrases: string[];
  explanation: string;
  example: string;
  ladder: DifficultyStep[];
  misconceptions: Record<string, string>; // wrong-answer pattern -> misconception label
}

export const CURRICULUM: Concept[] = [
  {
    id: "signed-multiplication",
    subject: "mathematics",
    topic: "Multiplication of signed numbers",
    concept: "Why a negative times a negative is positive",
    triggerPhrases: [
      "negative times negative",
      "negative multiply negative",
      "why negative",
      "minus times minus",
      "negative number multiply",
    ],
    explanation:
      "Think of multiplication as repeated change in direction. Multiplying by a negative number reverses direction. Reverse direction twice and you end up facing the positive direction again — that's why a negative times a negative gives a positive.",
    example: "For example, -2 x -3 means 'reverse -2, three times', which lands you on positive 6.",
    ladder: [
      {
        difficulty: 1,
        question: "If -4 x -3 = ?, what do you think the answer is?",
        expectedAnswer: "12",
        acceptableAnswers: ["12", "twelve", "positive 12", "+12"],
      },
      {
        difficulty: 2,
        question: "Now let's make it slightly harder. What happens with -6 x -2?",
        expectedAnswer: "12",
        acceptableAnswers: ["12", "twelve", "positive 12", "+12"],
      },
      {
        difficulty: 3,
        question: "What about -5 x -5?",
        expectedAnswer: "25",
        acceptableAnswers: ["25", "twenty five", "twenty-five", "positive 25"],
      },
      {
        difficulty: 4,
        question: "Try -7 x -8.",
        expectedAnswer: "56",
        acceptableAnswers: ["56", "fifty six", "fifty-six"],
      },
    ],
    misconceptions: {
      "-12": "believes two negatives stay negative when multiplied",
      "negative 12": "believes two negatives stay negative when multiplied",
      "0": "may be confusing multiplication with addition of opposites",
    },
  },
  {
    id: "photosynthesis-chlorophyll",
    subject: "science",
    topic: "Photosynthesis and chlorophyll",
    concept: "Why chlorophyll absorbing light matters for photosynthesis",
    triggerPhrases: [
      "chlorophyll",
      "photosynthesis",
      "absorb light",
      "dey absorb light",
      "why plant green",
    ],
    explanation:
      "Chlorophyll is the pigment that captures light energy — mostly red and blue light — and reflects green light, which is why leaves look green. That captured light energy is what powers photosynthesis, letting the plant turn carbon dioxide and water into glucose and oxygen.",
    example: "Without chlorophyll to absorb light, the plant would have no energy source to build the sugars it needs to grow.",
    ladder: [
      {
        difficulty: 1,
        question: "So if a leaf had no chlorophyll at all, what do you think would happen to photosynthesis?",
        expectedAnswer: "it would stop or slow down because no light energy is captured",
        acceptableAnswers: [
          "it would stop",
          "no photosynthesis",
          "it would slow down",
          "photosynthesis would stop",
          "it can't happen",
        ],
      },
      {
        difficulty: 2,
        question: "Why does a leaf look green instead of, say, red or blue?",
        expectedAnswer: "because chlorophyll reflects green light and absorbs red and blue light",
        acceptableAnswers: [
          "it reflects green light",
          "chlorophyll reflects green",
          "green light is reflected not absorbed",
        ],
      },
    ],
    misconceptions: {
      "green light is absorbed": "believes chlorophyll absorbs the green light it reflects",
      "plants eat soil for energy": "confuses nutrient uptake with the plant's actual energy source",
    },
  },
  {
    id: "main-idea",
    subject: "english",
    topic: "Identifying the main idea of a passage",
    concept: "Distinguishing the main idea from supporting details",
    triggerPhrases: [
      "main idea",
      "identify the main idea",
      "what is this passage about",
      "central idea",
    ],
    explanation:
      "The main idea is the single most important point the whole passage is building toward — everything else in the passage (examples, facts, descriptions) exists to support or explain that one point. A good way to find it is to ask: 'if I could keep only one sentence, which one captures what every paragraph is really about?'",
    example: "In a passage about deforestation causing soil erosion and flooding, the main idea is the overall effect of deforestation — the erosion and flooding are supporting details, not the main idea itself.",
    ladder: [
      {
        difficulty: 1,
        question: "In a passage where every paragraph gives a different example of animals adapting to drought, what do you think the main idea is?",
        expectedAnswer: "animals adapt to survive in drought conditions",
        acceptableAnswers: [
          "animals adapt to drought",
          "how animals survive drought",
          "adaptation to drought",
        ],
      },
    ],
    misconceptions: {
      "the first sentence": "believes the main idea is always literally the first sentence rather than the unifying point",
    },
  },
];

/**
 * Regex-based fallback detectors, one per concept, for paraphrases that
 * don't contain any of the exact `triggerPhrases` substrings. These are
 * still fully deterministic pattern rules (no external model call) but
 * generalize better than a fixed phrase list — e.g. catching "minus"
 * as well as "negative", or numeric forms like "-7 x -8".
 */
const REGEX_DETECTORS: Record<string, RegExp> = {
  "signed-multiplication": /(negative|minus|-\s*\d+)\D{0,15}(negative|minus|-\s*\d+)\D{0,20}(times|multipl|x\s*-?\d)/i,
  "photosynthesis-chlorophyll": /chlorophyll|photosynthes/i,
  "main-idea": /main idea|central idea/i,
};

export function findConceptByTranscript(transcript: string): Concept | null {
  const lower = transcript.toLowerCase();
  for (const concept of CURRICULUM) {
    if (concept.triggerPhrases.some((phrase) => lower.includes(phrase))) {
      return concept;
    }
  }
  for (const concept of CURRICULUM) {
    const detector = REGEX_DETECTORS[concept.id];
    if (detector && detector.test(transcript)) {
      return concept;
    }
  }
  return null;
}

export function findConceptById(id: string): Concept | undefined {
  return CURRICULUM.find((c) => c.id === id);
}
