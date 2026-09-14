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
      "negative × negative",
      "negative x negative",
      "why does negative",
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
      "why do plants need sunlight",
      "plant need sunlight",
      "plants need sunlight",
      "why plants need sun",
      "leaves need sunlight",
      "leaf need sunlight",
      // ASR-corrupted / spacing variants of "photosynthesis" seen in real
      // transcripts. Conservative and specific to this concept's own
      // canonical word, not a general spelling-correction rule.
      "photo synthesis",
      "photo-synthesis",
      "photosintesis",
      "photosynthesis",
      "photos 10 cies",
      "photos 10-cies",
      "fotosynthesis",
      // Common paraphrase that never uses the word "photosynthesis" at all.
      "how plants make food",
      "how plant make food",
      "plants make their food",
      "plants make food",
      "plant make its own food",
      "wetin plants dey use sunlight",
      "wetin plant dey use sunlight",
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
  {
    id: "evaporation",
    subject: "science",
    topic: "Evaporation",
    concept: "Why liquid water can turn to vapor below its boiling point",
    triggerPhrases: [
      "evaporation",
      "evaporate",
      "water dey evaporate",
      "wetin be evaporation",
      "why water dey dry",
    ],
    explanation:
      "Evaporation happens when molecules at the surface of a liquid gain enough energy from their surroundings to escape into the air as vapor. This doesn't require the whole liquid to reach its boiling point — it's a surface effect driven by heat, air movement, and humidity, which is why a puddle dries up long before it would ever boil.",
    example: "That's why wet clothes hanging outside dry over time even on a day that's nowhere near 100 degrees.",
    ladder: [
      {
        difficulty: 1,
        question: "So does water have to reach 100 degrees Celsius to evaporate?",
        expectedAnswer: "no, evaporation happens below boiling point at the surface",
        acceptableAnswers: [
          "no",
          "it doesn't have to boil",
          "no it can happen below boiling",
          "surface evaporation happens without boiling",
        ],
      },
      {
        difficulty: 2,
        question: "Why do wet clothes eventually dry even on a cool day?",
        expectedAnswer: "surface water molecules gain enough energy to evaporate into the air",
        acceptableAnswers: [
          "the water evaporates slowly",
          "molecules escape into the air",
          "water evaporates even without boiling",
        ],
      },
    ],
    misconceptions: {
      "it needs to boil": "believes evaporation only happens once a liquid reaches its boiling point",
      "it needs 100 degrees": "believes evaporation requires reaching 100°C / boiling point",
    },
  },
  {
    id: "friction-rolling",
    subject: "science",
    topic: "Friction and rolling motion",
    concept: "Why friction slows down moving objects",
    triggerPhrases: [
      "ball eventually stop",
      "ball stop rolling",
      "why does a ball stop",
      "why ball stop roll",
      // The topic's own name, conservative since it is the canonical
      // term for this concept and not used elsewhere in the curriculum.
      "friction",
    ],
    explanation:
      "A rolling ball slows down because of friction — mainly rolling resistance between the ball and the surface, plus air resistance as it pushes through the air. Both of these act opposite to the direction of motion, continuously removing a small amount of the ball's kinetic energy until it comes to rest.",
    example: "That's why a ball rolls much farther on smooth, hard pavement than on thick grass — grass creates much more rolling resistance.",
    ladder: [
      {
        difficulty: 1,
        question: "Would the ball roll farther on smooth pavement or on thick grass, and why?",
        expectedAnswer: "farther on pavement because there is less friction/rolling resistance",
        acceptableAnswers: [
          "pavement because less friction",
          "smooth pavement",
          "less resistance on pavement",
        ],
      },
    ],
    misconceptions: {
      "it runs out of force": "believes motion requires a continuously stored 'force' that depletes, rather than being removed by friction",
    },
  },
  {
    id: "salt-dissolve",
    subject: "science",
    topic: "Dissolving and solutions",
    concept: "Why salt dissolves in water",
    triggerPhrases: [
      "salt dissolve",
      "why does salt dissolve",
      "salt dey dissolve",
      "dissolving",
      "dissolve in water",
    ],
    explanation:
      "Salt (sodium chloride) is made of charged ions held together by ionic bonds. Water molecules are polar — each one has a slightly negative and slightly positive end — so they surround and pull the sodium and chloride ions apart, spreading them evenly through the water. That's dissolving.",
    example: "This is also why salt doesn't dissolve well in oil — oil molecules aren't polar, so they can't pull the ions apart the same way.",
    ladder: [
      {
        difficulty: 1,
        question: "Why doesn't salt dissolve well in oil the way it does in water?",
        expectedAnswer: "oil is not polar so it cannot pull the charged ions apart",
        acceptableAnswers: [
          "oil is not polar",
          "oil molecules aren't polar",
          "oil can't pull the ions apart",
        ],
      },
    ],
    misconceptions: {
      "it melts": "confuses dissolving with melting — the salt isn't changing state, its ions are being separated by water molecules",
    },
  },
  {
    id: "affect-effect",
    subject: "english",
    topic: "Affect vs. effect",
    concept: "Distinguishing the verb 'affect' from the noun 'effect'",
    triggerPhrases: [
      "affect and effect",
      "affect vs effect",
      "difference between affect and effect",
    ],
    explanation:
      "'Affect' is almost always a verb meaning to influence something ('the rain affected the game'). 'Effect' is almost always a noun meaning the result of something ('the rain had an effect on the game'). A quick trick: if you need a verb, reach for 'affect'; if you need a noun (often after 'an' or 'the'), reach for 'effect'.",
    example: "'Lack of sleep affects concentration' (verb) vs. 'Lack of sleep has an effect on concentration' (noun).",
    ladder: [
      {
        difficulty: 1,
        question: "In the sentence 'The drought had a serious ___ on crop yields', should we use 'affect' or 'effect'?",
        expectedAnswer: "effect, because it's a noun following 'a'",
        acceptableAnswers: ["effect", "effect because it is a noun"],
      },
    ],
    misconceptions: {
      "affect": "used 'affect' where a noun is needed; 'effect' is the noun form",
    },
  },
  {
    id: "divide-by-zero",
    subject: "mathematics",
    topic: "Why division by zero is undefined",
    concept: "Why you cannot divide a number by zero",
    triggerPhrases: [
      "dividing by zero",
      "divide by zero",
      "division by zero",
      "why can't i divide by zero",
    ],
    explanation:
      "Division asks 'how many of this number fit into that number?' Dividing by zero would mean asking how many zeros fit into a number — but you could add zero to itself any number of times and never reach anything other than zero, so there's no single consistent answer. That's why mathematics defines division by zero as undefined rather than assigning it some value.",
    example: "Compare: 10 ÷ 2 = 5 because 2 fits into 10 exactly 5 times. There's no number of times 0 'fits into' 10 in that same sense.",
    ladder: [
      {
        difficulty: 1,
        question: "If 10 ÷ 2 = 5 because 2 fits into 10 five times, what goes wrong when you try the same idea with 10 ÷ 0?",
        expectedAnswer: "there is no number of zeros that fit into 10, so it is undefined",
        acceptableAnswers: [
          "there's no answer that works",
          "it's undefined",
          "no number of zeros fit into 10",
        ],
      },
    ],
    misconceptions: {
      "it's zero": "believes anything divided by zero equals zero, confusing it with zero divided by a number",
      "it's infinity": "a common informal intuition, but mathematics defines it as undefined rather than infinite in standard arithmetic",
    },
  },
  {
    id: "nouns",
    subject: "english",
    topic: "Nouns",
    concept: "Identifying nouns as naming words",
    triggerPhrases: [
      "what is a noun",
      "what are nouns",
      "explain noun",
      "explain nouns",
      "define noun",
      "define nouns",
      "nouns",
    ],
    explanation:
      "A noun is a word that names a person, place, thing, or idea — 'teacher', 'Lagos', 'chair', and 'freedom' are all nouns. A quick test: if you can put 'the' or 'a' in front of it and it still makes sense ('the teacher', 'a chair'), it's very likely a noun.",
    example: "In the sentence 'The teacher gave the student a book', the nouns are 'teacher', 'student', and 'book'.",
    ladder: [
      {
        difficulty: 1,
        question: "In the sentence 'The dog chased the ball across the yard', which words are the nouns?",
        expectedAnswer: "dog, ball, and yard",
        acceptableAnswers: [
          "dog ball yard",
          "dog, ball, yard",
          "dog and ball and yard",
        ],
      },
    ],
    misconceptions: {
      "chased": "picked out a verb (an action word) instead of a naming word",
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
export const REGEX_DETECTORS: Record<string, RegExp> = {
  "signed-multiplication": /(negative|minus|-\s*\d+)\D{0,15}(negative|minus|-\s*\d+)\D{0,20}(times|multipl|x\s*-?\d)/i,
  "photosynthesis-chlorophyll": /chlorophyll|photosynthes/i,
  "main-idea": /main idea|central idea/i,
  evaporation: /evaporat/i,
  "friction-rolling": /ball\D{0,20}(stop|roll)/i,
  "salt-dissolve": /salt\D{0,15}dissolv|iyọ̀\D{0,15}dissolv/i,
  "affect-effect": /\baffect\b.{0,15}\beffect\b/i,
  "divide-by-zero": /divid\w*\D{0,10}(by\s+)?zero/i,
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
