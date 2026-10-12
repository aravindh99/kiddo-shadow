import { config as loadEnv } from "dotenv";
import { GoogleGenAI, createPartFromBase64 } from "@google/genai";

console.log("GEMINI_SOLVER_FILE_LOADED");

loadEnv();

console.log("GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(
  /^models\//,
  ""
);
const GEMINI_SOLVER_MODELS = [
  process.env.GEMINI_SOLVER_MODEL,
  GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
]
  .filter(Boolean)
  .map((model) => String(model).replace(/^models\//, ""))
  .filter((model, index, models) => models.indexOf(model) === index);
const GEMINI_IMAGE_MODELS = [
  process.env.GEMINI_IMAGE_MODEL,
  process.env.GEMINI_SOLVER_MODEL,
  GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
]
  .filter(Boolean)
  .map((model) => String(model).replace(/^models\//, ""))
  .filter((model, index, models) => models.indexOf(model) === index);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export const STEM_NO_ANSWER_TEXT = "It is not provided in the book.";
const SOLVER_TEMPORARY_FAILURE_TEXT =
  "I could not generate an answer right now. Please try again in a moment.";
const PLANCK_CONSTANT = 6.62607015e-34;
const SPEED_OF_LIGHT = 299792458;
const ELEMENTARY_CHARGE = 1.602176634e-19;
const TWO_PI = 2 * Math.PI;
const GENERIC_NUMERICAL_VERB_PATTERN =
  /\b(find|calculate|determine|evaluate|compute|solve|corresponding|derive|obtain|what\s+is|how\s+much|how\s+many)\b/i;
const GENERIC_SUBJECT_HINT_PATTERN =
  /\b(frequency|amplitude|wavelength|velocity|acceleration|force|field|potential|current|charge|resistance|power|energy|work|mass|molarity|moles?|atoms?|molecules?|concentration|pressure|density|profit|loss|discount|interest|principal|amount|balance|ratio|percentage|equation|formula|sum|average|factorial|acid|base|solution|mixture|dilute|diluted|alloy|reaction|reactants?|products?|oxidation|reduction|journal|ledger|trial\s+balance|balance\s+sheet|cash\s+book|debit|credit|capital|assets?|liabilities|revenue|expense|stock|inventory|demand|supply|market|table|graph|diagram|set|sets|subset|superset|union|intersection|venn|sin|cos|tan|cot|sec|cosec|trigonometric|log|ln)\b/i;
const GENERIC_UNIT_PATTERN =
  /\b(?:hz|khz|mhz|ghz|ev|mev|gev|v|mv|kv|a|ma|amp|amps|w|kw|mw|j|kj|nj|mj|t|tesla|wb|weber|c|coulomb|ohm|omega|pa|atm|bar|mol|mole|molar|n\/c|v\/m|rad\/s|m\/s|m\/s\^?2|cm|mm|m|km|g|kg|mg|l|ml|litre|litres|liter|liters|rs|₹|%|hour|hours|hr|hrs|min|mins|minute|minutes|second|seconds|sec|secs)\b/i;
const GENERIC_ASSIGNMENT_PATTERN = /\b[a-z]\s*=\s*-?\d+(?:\.\d+)?\b/i;
const DIRECT_GEMINI_SUBJECT_PATTERN =
  /\b(math|maths|mathematics|physics|chemistry|accounts?|accountancy|commerce|business|trade|market|demand|supply|algebra|geometry|trigonometry|mensuration|statistics|probability|set|sets|subset|superset|union|intersection|sin|cos|tan|cot|sec|cosec|log|ln)\b/i;
const DIRECT_GEMINI_PROBLEM_PATTERN =
  /\b(solve|calculate|find|determine|evaluate|compute|simplify|derive|verify|prove|show\s+that|balance|balancing|draw|plot|interpret|prepare|record|post|pass|sum|numerical|word\s+problem|equation|formula|inequality|expression|ratio|percentage|interest|profit|loss|discount|average|mean|median|mode|probability|perimeter|area|volume|speed|distance|time|velocity|acceleration|force|energy|power|current|charge|resistance|molarity|moles?|concentration|acid|base|salt|solution|mixture|dilute|diluted|alloy|reaction|chemical\s+equation|subset|superset|union|intersection|identity|ledger|debit|credit|trial\s+balance|journal(?:ise|ize)?|journal\s+entry|pass\s+journal\s+entries|balance\s+sheet|cash\s+book|goodwill|demand|supply|market|business|table|graph|diagram)\b/i;
const DIRECT_GEMINI_SET_PATTERN =
  /\b(natural|whole|integer|integers|rational|real)\s+numbers?\b/i;
const DIRECT_GEMINI_SYMBOL_PATTERN = /(?:<=|>=|<|>|=|√|π|²|³|[+\-*/^])/i;
const SOLVER_SUPPORTED_SUBJECT_PATTERN =
  /\b(math|maths|mathematics|physics|chemistry|accounts?|accountancy|commerce|business(?:\s+studies)?|economics|algebra|calculus|geometry|trigonometry|mensuration|statistics|probability|mechanics|electricity|magnetism|thermodynamics|optics|stoichiometry|organic|inorganic|journal|ledger|trial\s+balance|balance\s+sheet|cash\s+book|debit|credit|profit|loss|demand|supply|market)\b/i;
const STRUCTURED_SOLVER_INPUT_PATTERN =
  /\b(table|graph|diagram|figure|chart|data|ledger|journal|trial\s+balance|balance\s+sheet|cash\s+book|equation|reaction)\b/i;
const FORCE_DIRECT_GEMINI_PATTERN =
  /\b(math|maths|mathematics|physics|chemistry|accounts?|accountancy|commerce|business|trade|market|demand|supply|equation|equations|sum|sums|algebra|trigonometry|mensuration|probability|statistics|acid|solution|mixture|dilute|diluted|alloy|concentration|set|sets|subset|superset|union|intersection)\b/i;
const THEORY_QUESTION_PATTERN =
  /\b(what\s+is|what\s+are|why|how|define|explain|describe|differentiate|distinguish|state|list|write\s+(?:a\s+)?short\s+note|short\s+note|note\s+on|uses?\s+of|advantages?\s+of|disadvantages?\s+of|importance\s+of|principle\s+of|law\s+of|journal(?:ise|ize)?|pass\s+journal\s+entries|record|prepare)\b/i;

const GENERAL_ACADEMIC_SUBJECT_QUESTION_PATTERN =
  /\b(what\s+is|what\s+are|why|how|define|explain|describe|differentiate|distinguish|state|list|journal(?:ise|ize)?|journal\s+entry|pass\s+journal\s+entries|record|prepare|debit|credit|ledger|trial\s+balance|balance\s+sheet|goodwill|business|commerce|demand|supply|market)\b/i;
const SUBJECT_THEORY_HINT_PATTERN =
  /\b(algebra|geometry|triangle|circle|quadrilateral|polynomial|quadratic|factorisation|inequality|equation|theorem|coordinate\s+geometry|arithmetic\s+progression|probability|statistics|mean|median|mode|set|sets|subset|superset|union|intersection|venn|sin|cos|tan|cot|sec|cosec|trigonometric|identity|log|ln|ohm'?s\s+law|newton'?s\s+laws?|work|energy|power|force|motion|speed|velocity|acceleration|current|voltage|resistance|magnetism|reflection|refraction|lens|mirror|wave|sound|light|photoelectric|atom|molecule|element|compound|mixture|valency|electron|proton|neutron|acid|base|salt|ph|periodic\s+table|chemical\s+bond|oxidation|reduction|molarity|mole\s+concept|journal|ledger|trial\s+balance|balance\s+sheet|debit|credit|capital|liability|asset|revenue|expense|depreciation|interest|discount|profit|loss|business|trade|commerce|market|demand|supply|consumer|producer|goodwill|partnership|shares?|debentures?|gst|inventory|stock|cash\s+book|bills?\s+of\s+exchange)\b/i;
const FILL_IN_THE_BLANK_PATTERN =
  /(?:_{2,}|\.{3,}|-{3,}|…|\bfill\s+in\s+the\s+blanks?\b|\bfill\s+the\s+blanks?\b|\bfill\s+up\s+the\s+blanks?\b|\bcomplete\s+the\s+(?:sentence|statement)s?\b)/i;
const ACADEMIC_FILL_BLANK_HINT_PATTERN =
  /\b(school|study|student|class|grade|lesson|chapter|homework|worksheet|textbook|exam|test|quiz|math|maths|mathematics|number|numbers|digit|digits|place\s+value|expanded\s+form|smallest|largest|successor|predecessor|fraction|decimal|multiple|factor|prime|composite|capital|country|state|city|continent|ocean|river|mountain|planet|solar\s+system|earth|moon|sun|photosynthesis|plant|plants|cell|cells|organ|organism|human\s+body|animal|animals|science|physics|chemistry|biology|history|geography|civics|grammar|noun|pronoun|verb|adjective|adverb|preposition|conjunction|sentence|synonym|antonym|tense|article|singular|plural|subject|predicate)\b/i;

const STRICT_DERIVATION_PROMPT = `
You are a strict mathematical derivation engine.

IMPORTANT RULES:
- Return ONLY derivation steps with one short explanation per step.
- DO NOT teach concepts.
- DO NOT use bullet points.
- DO NOT use paragraph explanations.
- Keep each explanation to one simple student-friendly line.
- Use Grade 6 level words in explanations.
- Each explanation must briefly explain why the next step is used.
- Explain variables, notation, abbreviations, formulas, and mathematical symbols the first time they appear.
- Do not add theory notes, unrelated examples, or extra teaching paragraphs.
- Do not use the dollar sign character anywhere in the answer.

OUTPUT FORMAT:

Step 1:

Explanation:
[one short line explaining why the next step is used]

Operation:
[equation]

Step 2:

Explanation:
[one short line explaining why the next step is used]

Operation:
[equation]

Step 3:

Explanation:
[one short line explaining why the next step is used]

Operation:
[equation]

...

Final Answer:
[final result only]

RULES:
- Every step must include one mathematical transformation and one short explanation.
- Each Operation must show exactly one logical mathematical action.
- If a calculation needs several transformations, split them into separate Step/Explanation/Operation blocks.
- Do not combine multiple equal-sign transformations in one Operation.
- Do not skip intermediate mathematical operations.
- Keep output compact.
- Use proper mathematical notation.
- Use fractions properly.
- Do not wrap equations or expressions with dollar signs.
- No extra text before or after the derivation.
- No markdown explanations outside the required Explanation lines.
- Prefer simple words such as "Check" instead of "Determine", "Find" instead of "Calculate", and "Much less" instead of "Significantly less".

EXAMPLE:

Step 1:

Explanation:
First, write the original equation so we can solve it step by step.

Operation:
4(3x-2)+5=2(x+7)+3x

Step 2:

Explanation:
Next, remove brackets because multiplying each term makes the equation simpler.

Operation:
12x-8+5=2x+14+3x

Step 3:

Explanation:
Now combine like terms because adding similar parts makes each side shorter.

Operation:
12x-3=5x+14

Step 4:

Explanation:
x is the unknown number, so keep x terms on one side.

Operation:
12x-5x=14+3

Step 5:

Explanation:
Now subtract x terms because this leaves one x term to solve.

Operation:
7x=17

Step 6:

Explanation:
Finally, divide by 7 because x is multiplied by 7.

Operation:
x=17/7

Final Answer:
x=17/7
`.trim();

const STRICT_DERIVATION_INTENT_PATTERN =
  /\b(solve|calculate|find|determine|evaluate|compute|simplify|derive|verify|prove|show\s+that|factor|expand|equation|numerical)\b/i;
const STRICT_DERIVATION_NOTATION_PATTERN =
  /(?:=|<=|>=|<|>|√|π|²|³|[+\-*/^()]|\\frac|\\sin|\\cos|\\tan|\b(?:sin|cos|tan|cot|sec|cosec|log|ln|sqrt)\b)/i;

const EQUATION_QUESTION_PATTERNS = [
  /\bcalculate\b/i,
  /\bevaluate\b/i,
  /\bsolve\b/i,
  /\bsimplify\b/i,
  /\bsum\b/i,
  /\bdifference\b/i,
  /\bproduct\b/i,
  /\bquotient\b/i,
  /\bconsecutive\b/i,
  /\beven\s+numbers?\b/i,
  /\bodd\s+numbers?\b/i,
  /\bderive\b/i,
  /\bderivative\b/i,
  /\bprove\b/i,
  /\bfind\s+the\s+value\b/i,
  /\bfind\s+the\s+principal\s+value\b/i,
  /\bprincipal\s+value\b/i,
  /\bvalue\s+of\b/i,
  /\bformula\b/i,
  /\bequation\b/i,
  /\bnumerical\b/i,
  /\bintegrate\b/i,
  /\bdifferentiate\b/i,
  /\broot\b/i,
  /\broots\b/i,
  /\bmean\b/i,
  /\baverage\b/i,
  /\bmedian\b/i,
  /\bmode\b/i,
  /\bprobability\b/i,
  /\bratio\b/i,
  /\bpercentage\b/i,
  /\barea\b/i,
  /\bperimeter\b/i,
  /\bvolume\b/i,
  /\binterest\b/i,
  /\bthreshold\s+frequency\b/i,
  /\bstopping\s+potential\b/i,
  /\bwork\s+function\b/i,
  /\bwavelength\b/i,
  /\bvelocity\b/i,
  /\bacceleration\b/i,
  /\bspeed\b/i,
  /\bstandard\s+deviation\b/i,
  /\bvariance\b/i,
  /\bsin\s*\^?\s*-?1\b/i,
  /\bcos\s*\^?\s*-?1\b/i,
  /\btan\s*\^?\s*-?1\b/i,
  /\blog\b/i,
  /\bln\b/i,
  /\bfactorial\b/i,
  /\bdy\/dx\b/i,
  /\bdx\/dt\b/i,
  /\bf\s*\(\s*x\s*\)/i,
  /√/,
  /!/,
  /(?:<=|>=|<|>)/,
  /[=+\-*/^]/,
  /\d+\s*(?:cm|mm|m|km|kg|g|mg|s|ms|m\/s|m\/s\^2|n|j|w|v|a|ohm|pa|mol|%|rs|₹|ev|hz)/i,
];

const countNumericValues = (text) => (String(text || "").match(/-?\d+(?:\.\d+)?/g) || []).length;

const normalizeQuestionForSolver = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/[−–—]/g, "-")
    .replace(/[×✕]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[∕]/g, "/")
    .replace(/[{\[]/g, "(")
    .replace(/[}\]]/g, ")")
    .replace(/\bi\s*-\s*\(\s*-\s*([^)]+?)\s*\)/gi, "i($1)")
    .replace(/\bi\s*-\s*\(/gi, "i(-")
    .replace(/\bi\s*\+\s*\(/gi, "i(")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[π]/g, "pi")
    .replace(/[θ]/g, "theta")
    .replace(/[λ]/g, "lambda")
    .replace(/[ω]/g, "omega")
    .replace(/[ν]/g, "nu")
    .replace(/[ϕφ]/g, "phi")
    .replace(/[²]/g, "^2")
    .replace(/[³]/g, "^3")
    .replace(/[₀]/g, "0")
    .replace(/[₁]/g, "1")
    .replace(/[₂]/g, "2")
    .replace(/[₃]/g, "3")
    .replace(/[₄]/g, "4")
    .replace(/[₅]/g, "5")
    .replace(/[₆]/g, "6")
    .replace(/[₇]/g, "7")
    .replace(/[₈]/g, "8")
    .replace(/[₉]/g, "9")
    .replace(/\s+/g, " ")
    .trim();

const looksLikeGenericNumericalQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return false;

  const numericCount = countNumericValues(text);
  const hasVerb = GENERIC_NUMERICAL_VERB_PATTERN.test(text);
  const hasSubjectHint = GENERIC_SUBJECT_HINT_PATTERN.test(text);
  const hasUnit = GENERIC_UNIT_PATTERN.test(text);
  const hasAssignment = GENERIC_ASSIGNMENT_PATTERN.test(text);
  const hasMathSymbols = /[=+\-*/^]/.test(text);

  if (numericCount >= 2 && (hasVerb || hasAssignment) && (hasUnit || hasSubjectHint || hasMathSymbols)) {
    return true;
  }

  if (numericCount >= 3 && (hasUnit || hasSubjectHint) && (hasVerb || hasMathSymbols)) {
    return true;
  }

  return false;
};

const looksLikeDirectGeminiSchoolQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return false;

  const numericCount = countNumericValues(text);
  const hasSubjectKeyword = DIRECT_GEMINI_SUBJECT_PATTERN.test(text);
  const hasProblemKeyword = DIRECT_GEMINI_PROBLEM_PATTERN.test(text);
  const hasSetKeyword = DIRECT_GEMINI_SET_PATTERN.test(text);
  const hasNotation = DIRECT_GEMINI_SYMBOL_PATTERN.test(text);
  const hasVariable = /\b[a-z]\b/i.test(text);

  if (looksLikeGenericNumericalQuestion(text)) {
    return true;
  }

  if (hasSubjectKeyword && (hasProblemKeyword || hasSetKeyword || hasNotation || numericCount >= 1)) {
    return true;
  }

  if (hasProblemKeyword && (hasSetKeyword || hasNotation || numericCount >= 1 || hasVariable)) {
    return true;
  }

  if (hasSetKeyword && (hasNotation || hasVariable || numericCount >= 1)) {
    return true;
  }

  return false;
};

const looksLikeTheorySubjectQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return false;

  const numericCount = countNumericValues(text);
  const numericalLookingPrompt =
    looksLikeGenericNumericalQuestion(text) ||
    (numericCount >= 2 &&
      /\b(how\s+many|calculate|find|solve|determine|evaluate|must\s+be\s+added|will\s+have\s+to\s+be\s+added)\b/i.test(
        text
      ) &&
      (GENERIC_SUBJECT_HINT_PATTERN.test(text) || GENERIC_UNIT_PATTERN.test(text)));

  if (numericalLookingPrompt) {
    return false;
  }

  const hasTheoryIntent = THEORY_QUESTION_PATTERN.test(text);
  const hasSubjectSignal =
    DIRECT_GEMINI_SUBJECT_PATTERN.test(text) || SUBJECT_THEORY_HINT_PATTERN.test(text);

  if (hasTheoryIntent && hasSubjectSignal) {
    return true;
  }

  if (
    /^(define|explain|describe|state|list|differentiate|distinguish|what\s+is|what\s+are|why|how)\b/i.test(
      text
    ) &&
    hasSubjectSignal
  ) {
    return true;
  }

  return false;
};

export const isEducationalFillInBlankQuestion = (question) => {
  const exactText = String(question || "").trim();
  const text = normalizeQuestionForSolver(exactText);
  if (!exactText || !text) return false;

  if (!FILL_IN_THE_BLANK_PATTERN.test(exactText)) {
    return false;
  }

  const hasAcademicHint =
    ACADEMIC_FILL_BLANK_HINT_PATTERN.test(exactText) ||
    DIRECT_GEMINI_SUBJECT_PATTERN.test(exactText) ||
    SUBJECT_THEORY_HINT_PATTERN.test(exactText);
  if (!hasAcademicHint) {
    return false;
  }

  const asksForLongExplanation =
    /\b(explain|describe|discuss|essay|write\s+(?:a\s+)?note|why|how)\b/i.test(text);
  if (asksForLongExplanation) {
    return false;
  }

  return /\b(is|are|was|were|occurs?|happens?|called|known|means|refers|equals?|has|have|formed|located|found|made)\b/i.test(
    text
  );
};

const shouldForceDirectGeminiSolve = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return false;

  if (FORCE_DIRECT_GEMINI_PATTERN.test(text)) {
    return true;
  }

  if (DIRECT_GEMINI_SET_PATTERN.test(text)) {
    return true;
  }

  if (/(?:<=|>=|<|>)/.test(text)) {
    return true;
  }

  if (/[=+\-*/^]/.test(text) && /\b[a-z]\b/i.test(text)) {
    return true;
  }

  return looksLikeDirectGeminiSchoolQuestion(text);
};

export const isEquationBasedQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return false;

  const exactText = String(question || "").trim();
  const numericCount = countNumericValues(exactText);
  const hasSolverSubject = SOLVER_SUPPORTED_SUBJECT_PATTERN.test(exactText);
  const hasProblemIntent = DIRECT_GEMINI_PROBLEM_PATTERN.test(exactText);
  const hasSubjectHint = GENERIC_SUBJECT_HINT_PATTERN.test(exactText);
  const hasStructuredInput = STRUCTURED_SOLVER_INPUT_PATTERN.test(exactText);
  const hasFormulaOrNotation =
    DIRECT_GEMINI_SYMBOL_PATTERN.test(exactText) ||
    /\b(?:sin|cos|tan|cot|sec|cosec|log|ln|sqrt|root|dy\/dx|dx\/dt)\b/i.test(exactText) ||
    /[√πθλμΩω²³₀₁₂₃₄₅₆₇₈₉]/u.test(exactText);

  if (
    hasSolverSubject &&
    (hasProblemIntent || hasSubjectHint || hasStructuredInput || hasFormulaOrNotation || numericCount > 0)
  ) {
    return true;
  }

  if (
    (hasProblemIntent || hasStructuredInput) &&
    (hasSubjectHint || hasFormulaOrNotation || numericCount >= 2)
  ) {
    return true;
  }

  return (
    isEducationalFillInBlankQuestion(exactText) ||
    looksLikeTheorySubjectQuestion(text) ||
    shouldForceDirectGeminiSolve(text) ||
    EQUATION_QUESTION_PATTERNS.some((pattern) => pattern.test(text)) ||
    looksLikeGenericNumericalQuestion(text) ||
    (GENERAL_ACADEMIC_SUBJECT_QUESTION_PATTERN.test(text) &&
      (DIRECT_GEMINI_SUBJECT_PATTERN.test(text) || SUBJECT_THEORY_HINT_PATTERN.test(text)))
  );
};

const isStrictDerivationQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return false;

  return STRICT_DERIVATION_INTENT_PATTERN.test(text) && STRICT_DERIVATION_NOTATION_PATTERN.test(text);
};

const buildBasicStemAnswer = ({ formula, given, substitution, calculation, finalAnswer }) =>
  [
    `Formula: ${formula || "As implied by the question"}`,
    `Given: ${given || "Values taken from the question"}`,
    `Substitution: ${substitution || "Substitute the given values into the formula or equation"}`,
    `Calculation: ${calculation || "Calculate step by step"}`,
    `Final Answer: ${finalAnswer || "unit not specified"}`,
  ].join("\n");

const INDIAN_PLACE_NAMES = [
  "ones",
  "tens",
  "hundreds",
  "thousands",
  "ten thousands",
  "lakhs",
  "ten lakhs",
  "crores",
  "ten crores",
  "hundred crores",
];

const formatIndianNumber = (value) => {
  const numericText = String(Math.trunc(Math.abs(Number(value) || 0)));
  if (numericText.length <= 4) return numericText;

  const lastThree = numericText.slice(-3);
  const prefix = numericText.slice(0, -3);
  const groupedPrefix = prefix.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${groupedPrefix},${lastThree}`;
};

const formatInternationalNumber = (digits) => {
  const normalized = String(digits || "")
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");
  if (!normalized) return null;
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const isInternationalNumberFormattingQuestion = (text) => {
  const normalized = String(text || "").toLowerCase();
  if (/\bindian\s+numbering\s+system\b/.test(normalized)) return false;

  return (
    /\binternational\s+(?:system|numbering\s+system)\b/.test(normalized) ||
    /\bstandard\s+(?:numeral|number)\s+grouping\b/.test(normalized) ||
    /\bstandard\s+(?:numeral|number)\s+format(?:ting)?\b/.test(normalized) ||
    /\bplace\s+value\s+format(?:ting)?\b/.test(normalized) ||
    /\b(?:use|insert|put|place)\s+commas?\b/.test(normalized) ||
    /\bwrite\b.+\b(?:with|using)\s+commas?\b/.test(normalized)
  );
};

const extractNumberForFormattingQuestion = (text) => {
  const candidates = String(text || "").match(/\d[\d,]*/g) || [];
  const usable = candidates
    .map((candidate) => ({
      raw: candidate,
      digits: candidate.replace(/,/g, ""),
      hasComma: candidate.includes(","),
    }))
    .filter((candidate) => /^\d+$/.test(candidate.digits))
    .filter((candidate) => candidate.digits.length > 1);

  if (!usable.length) return null;

  usable.sort((a, b) => {
    if (b.digits.length !== a.digits.length) return b.digits.length - a.digits.length;
    if (a.hasComma !== b.hasComma) return a.hasComma ? -1 : 1;
    return 0;
  });

  return usable[0].digits;
};

const solveInternationalNumberFormattingQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text || !isInternationalNumberFormattingQuestion(text)) return null;

  const digits = extractNumberForFormattingQuestion(text);
  if (!digits) return null;

  return formatInternationalNumber(digits);
};

const extractTargetDigitForPlaceQuestion = (text) => {
  const normalized = String(text || "");
  const targetPatterns = [
    /\b(?:place|face)\s+value\s+of\s+([0-9])\b/i,
    /\b(?:place|face)\s+value\s+(?:for|of\s+the\s+digit)\s+([0-9])\b/i,
    /\bdigit\s+([0-9])\b/i,
  ];

  for (const pattern of targetPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const extractNumberForPlaceQuestion = (text, targetDigit) => {
  const candidates = String(text || "").match(/\d[\d,]*/g) || [];
  const usable = candidates
    .map((candidate) => ({
      raw: candidate,
      digits: candidate.replace(/,/g, ""),
      hasComma: candidate.includes(","),
    }))
    .filter((candidate) => /^\d+$/.test(candidate.digits))
    .filter((candidate) => candidate.digits.length > 1 || candidate.digits !== targetDigit);

  if (!usable.length) return null;

  usable.sort((a, b) => {
    if (a.hasComma !== b.hasComma) return a.hasComma ? -1 : 1;
    return b.digits.length - a.digits.length;
  });

  return usable[0].digits;
};

const solvePlaceOrFaceValueQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text || !/\b(?:place|face)\s+value\b/i.test(text)) return null;

  const targetDigit = extractTargetDigitForPlaceQuestion(text);
  const numberDigits = extractNumberForPlaceQuestion(text, targetDigit);
  if (!targetDigit || !numberDigits) return null;

  if (/\bface\s+value\b/i.test(text)) {
    return `Final Answer: ${targetDigit}`;
  }

  const digitIndex = numberDigits.indexOf(targetDigit);
  if (digitIndex < 0) return null;

  const placesFromRight = numberDigits.length - digitIndex - 1;
  const placeValue = Number(targetDigit) * 10 ** placesFromRight;
  if (!Number.isSafeInteger(placeValue)) return null;

  const placeName = INDIAN_PLACE_NAMES[placesFromRight];
  const formattedPlaceValue = formatIndianNumber(placeValue);

  return [
    placeName ? `The digit ${targetDigit} is in the ${placeName} place.` : "",
    `Final Answer: ${formattedPlaceValue}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const solveDirectArithmeticQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (/\b(?:place|face)\s+value\b/i.test(text)) return null;
  if (isInternationalNumberFormattingQuestion(text)) return null;

  const match = text.match(/([0-9][0-9+\-*/().\s]+[0-9)])\s*=?\s*\??$/);
  if (!match) return null;

  const expression = String(match[1] || "").replace(/\s+/g, "");
  if (!/^[0-9+\-*/().]+$/.test(expression)) return null;

  try {
    const result = Function(`"use strict"; return (${expression});`)();
    if (!Number.isFinite(result)) return null;

    return buildBasicStemAnswer({
      formula: "Arithmetic operation",
      given: expression,
      substitution: expression,
      calculation: `${expression} = ${result}`,
      finalAnswer: `${result} (unit not specified)`,
    });
  } catch {
    return null;
  }
};

const solveFactorialQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;

  const match = text.match(/\b(?:evaluate|find|calculate|compute)?\s*\(?\s*(?:\(?[ivx]+\)?\s*)?(\d+)\s*!\s*\)?[.?]?\s*$/i);
  if (!match?.[1]) return null;

  const value = Number(match[1]);
  if (!Number.isInteger(value) || value < 0 || value > 170) return null;

  let factorial = 1;
  for (let number = 2; number <= value; number += 1) {
    factorial *= number;
  }

  return buildBasicStemAnswer({
    formula: "n! = 1 x 2 x 3 x ... x n",
    given: `n = ${value}`,
    substitution: `${value}! = ${Array.from({ length: value }, (_, index) => index + 1).join(" x ") || "1"}`,
    calculation: `${value}! = ${factorial}`,
    finalAnswer: `${factorial} (unit not specified)`,
  });
};

const solveArithmeticEqualityQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const match = text.match(/^\s*([0-9+\-*/().\s]+)\s*=\s*([0-9+\-*/().\s]+)\s*\??\s*$/);
  if (!match) return null;

  const leftExpression = String(match[1] || "").replace(/\s+/g, "");
  const rightExpression = String(match[2] || "").replace(/\s+/g, "");

  if (!/^[0-9+\-*/().]+$/.test(leftExpression) || !/^[0-9+\-*/().]+$/.test(rightExpression)) {
    return null;
  }

  try {
    const leftValue = Function(`"use strict"; return (${leftExpression});`)();
    const rightValue = Function(`"use strict"; return (${rightExpression});`)();
    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
      return null;
    }

    const isCorrect = leftValue === rightValue;

    return buildBasicStemAnswer({
      formula: "Arithmetic equality check",
      given: `${leftExpression} = ${rightExpression}`,
      substitution: `${leftExpression} = ${rightExpression}`,
      calculation: `${leftExpression} = ${leftValue} and ${rightExpression} = ${rightValue}`,
      finalAnswer: isCorrect
        ? `${leftExpression} = ${rightExpression} is correct (unit not specified)`
        : `${leftExpression} = ${rightExpression} is incorrect; the correct value is ${leftValue} (unit not specified)`,
    });
  } catch {
    return null;
  }
};

const solveConsecutiveNumbersQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const match = text.match(
    /\b(?:sum|addition)\s+of\s+two\s+consecutive\s+(even|odd)?\s*numbers?\s+(?:is|=)\s*(\d+(?:\.\d+)?)/i
  );
  if (!match) return null;

  const kind = String(match[1] || "").toLowerCase();
  const total = Number(match[2]);
  if (!Number.isFinite(total)) return null;

  let first = total / 2 - 0.5;
  let second = total / 2 + 0.5;

  if (kind === "even") {
    first = total / 2 - 1;
    second = total / 2 + 1;
  } else if (kind === "odd") {
    first = total / 2 - 1;
    second = total / 2 + 1;
  }

  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  if (Math.abs(second - first) !== 2) return null;
  if (kind === "even" && (!Number.isInteger(first) || first % 2 !== 0 || second % 2 !== 0)) {
    return null;
  }
  if (kind === "odd" && (!Number.isInteger(first) || Math.abs(first % 2) !== 1 || Math.abs(second % 2) !== 1)) {
    return null;
  }

  const variableForm =
    kind === "even" ? "x and x + 2" : kind === "odd" ? "x and x + 2" : "x and x + 2";

  return buildBasicStemAnswer({
    formula: `${variableForm}, and their sum is ${total}`,
    given: `Sum = ${total}`,
    substitution: `x + (x + 2) = ${total}`,
    calculation: `2x + 2 = ${total}, so 2x = ${total - 2}, x = ${(total - 2) / 2}. Therefore the numbers are ${first} and ${second}.`,
    finalAnswer: `${first} and ${second} (unit not specified)`,
  });
};

const normalizeEquationForEvaluation = (expression) =>
  String(expression || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/(^[,:;?]+|[,:;?]+$)/g, "")
    .replace(/(?<!\d)\.(?!\d)/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/\^/g, "**")
    .replace(/(\d)x/g, "$1*x")
    .replace(/x(\d)/g, "x*$1")
    .replace(/\)x/g, ")*x")
    .replace(/x\(/g, "x*(")
    .replace(/(\d)\(/g, "$1*(")
    .replace(/\)(\d)/g, ")*$1");

const formatSolvedNumber = (value) => {
  if (!Number.isFinite(value)) return String(value);
  const roundedInteger = Math.round(value);
  if (Math.abs(value - roundedInteger) < 1e-9) {
    return String(roundedInteger);
  }
  return String(Number(value.toFixed(6)));
};

const normalizeVectorAxis = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\^ˆ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^ijkxyz]/g, "");

const parseFrequencyToHz = (value, unit) => {
  const numeric = Number(value);
  const normalizedUnit = String(unit || "").toLowerCase();
  if (!Number.isFinite(numeric)) return null;
  if (normalizedUnit === "ghz") return numeric * 1e9;
  if (normalizedUnit === "mhz") return numeric * 1e6;
  if (normalizedUnit === "khz") return numeric * 1e3;
  return numeric;
};

const WORD_NUMBER_MAP = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const parseWordOrDigitNumber = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number(text);
  return WORD_NUMBER_MAP[text] ?? null;
};

const cleanMathExpressionFragment = (value) =>
  String(value || "")
    .trim()
    .replace(/^[,:;?]+/, "")
    .replace(/[,:;?]+$/, "")
    .replace(/\.(?=\s*$)/, "")
    .replace(/(?<!\d)\.(?!\d)/g, "")
    .trim();

const parseSimpleLinearCoefficients = (expression) => {
  const normalized = normalizeEquationForEvaluation(expression);
  if (!normalized || !/x/i.test(normalized)) {
    return null;
  }

  let evaluate;
  try {
    evaluate = Function("x", `"use strict"; return (${normalized});`);
  } catch {
    return null;
  }

  try {
    const valueAtZero = evaluate(0);
    const valueAtOne = evaluate(1);
    const valueAtTwo = evaluate(2);

    if (![valueAtZero, valueAtOne, valueAtTwo].every(Number.isFinite)) {
      return null;
    }

    const coefficient = valueAtOne - valueAtZero;
    const intercept = valueAtZero;
    const linearityCheck = valueAtTwo - valueAtOne;

    if (Math.abs(linearityCheck - coefficient) > 1e-9) {
      return null;
    }

    return {
      coefficient,
      intercept,
      normalized,
    };
  } catch {
    return null;
  }
};

const parseNumericExpressionValue = (expression) => {
  const normalized = normalizeEquationForEvaluation(expression);
  if (!normalized || /x/i.test(normalized)) {
    return null;
  }

  try {
    const value = Function(`"use strict"; return (${normalized});`)();
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const extractSolutionDomain = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (/\bnatural\s+numbers?\b/i.test(text)) return "natural";
  if (/\bwhole\s+numbers?\b/i.test(text)) return "whole";
  if (/\bintegers?\b/i.test(text)) return "integer";
  if (/\brational\s+numbers?\b/i.test(text)) return "rational";
  if (/\breal\s+numbers?\b/i.test(text)) return "real";
  return "real";
};

const buildDiscreteValuesFromRange = ({ domain, lowerBound, lowerInclusive, upperBound, upperInclusive }) => {
  const startFloor = domain === "natural" ? 1 : 0;
  let start = Number.isFinite(lowerBound)
    ? Math.ceil(lowerInclusive ? lowerBound : lowerBound + 1e-9)
    : startFloor;
  let end = Number.isFinite(upperBound)
    ? Math.floor(upperInclusive ? upperBound : upperBound - 1e-9)
    : null;

  if (domain === "natural" || domain === "whole") {
    start = Math.max(start, startFloor);
  }

  if (end === null) {
    return {
      values: null,
      text: domain === "natural" ? `all natural numbers greater than or equal to ${start}` : `all whole numbers greater than or equal to ${start}`,
    };
  }

  if (start > end) {
    return {
      values: [],
      text: "no value satisfies the inequality",
    };
  }

  const values = [];
  for (let current = start; current <= end; current += 1) {
    values.push(current);
    if (values.length > 200) {
      return {
        values: null,
        text: `${domain} numbers from ${start} to ${end}`,
      };
    }
  }

  return {
    values,
    text: values.join(", "),
  };
};

const formatContinuousRange = ({ lowerBound, lowerInclusive, upperBound, upperInclusive }) => {
  if (!Number.isFinite(lowerBound) && !Number.isFinite(upperBound)) {
    return "all real numbers";
  }

  if (!Number.isFinite(lowerBound)) {
    return `(-infinity, ${formatSolvedNumber(upperBound)}${upperInclusive ? "]" : ")"}`;
  }

  if (!Number.isFinite(upperBound)) {
    return `${lowerInclusive ? "[" : "("}${formatSolvedNumber(lowerBound)}, infinity)`;
  }

  return `${lowerInclusive ? "[" : "("}${formatSolvedNumber(lowerBound)}, ${formatSolvedNumber(upperBound)}${upperInclusive ? "]" : ")"}`;
};

const solveSimpleLinearInequalityQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text || !/(?:<=|>=|<|>)/.test(text) || !/x/i.test(text)) {
    return null;
  }

  const inequalityText = text
    .replace(/^\s*(solve|find|determine|calculate|evaluate|compute)\b[:\s]*/i, "")
    .replace(/\bwhen\b[\s\S]*$/i, "")
    .trim();

  const segmentedCandidates = inequalityText
    .split(/[.?!]\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => /(?:<=|>=|<|>)/.test(segment) && /x/i.test(segment));
  const searchText = segmentedCandidates.length
    ? segmentedCandidates[segmentedCandidates.length - 1]
    : inequalityText;

  const matches = [...searchText.matchAll(/([0-9x+\-*/().^\s]+?)\s*(<=|>=|<|>)\s*([0-9x+\-*/().^\s]+)/gi)];
  const match = matches.length ? matches[matches.length - 1] : null;
  if (!match?.[1] || !match?.[2] || !match?.[3]) {
    return null;
  }

  const leftRaw = cleanMathExpressionFragment(match[1]);
  const operator = String(match[2]).trim();
  const rightRaw = cleanMathExpressionFragment(match[3]);

  const leftLinear = parseSimpleLinearCoefficients(leftRaw);
  const rightLinear = /x/i.test(rightRaw) ? parseSimpleLinearCoefficients(rightRaw) : null;
  const leftConstant = leftLinear ? null : parseNumericExpressionValue(leftRaw);
  const rightConstant = rightLinear ? null : parseNumericExpressionValue(rightRaw);

  if (!leftLinear && leftConstant === null) {
    return null;
  }
  if (!rightLinear && rightConstant === null) {
    return null;
  }

  const leftCoefficient = leftLinear?.coefficient ?? 0;
  const leftIntercept = leftLinear?.intercept ?? leftConstant;
  const rightCoefficient = rightLinear?.coefficient ?? 0;
  const rightIntercept = rightLinear?.intercept ?? rightConstant;

  const netCoefficient = leftCoefficient - rightCoefficient;
  const netConstant = rightIntercept - leftIntercept;
  const domain = extractSolutionDomain(text);

  if (Math.abs(netCoefficient) < 1e-9) {
    const comparisonSatisfied =
      operator === "<"
        ? 0 < netConstant
        : operator === "<="
          ? 0 <= netConstant
          : operator === ">"
            ? 0 > netConstant
            : 0 >= netConstant;

    return buildBasicStemAnswer({
      formula: "Rearrange the inequality to compare constants",
      given: `${leftRaw} ${operator} ${rightRaw}`,
      substitution: `${formatSolvedNumber(netCoefficient)}x ${operator} ${formatSolvedNumber(netConstant)}`,
      calculation: comparisonSatisfied
        ? "The variable term cancels out and the remaining statement is always true."
        : "The variable term cancels out and the remaining statement is false.",
      finalAnswer: comparisonSatisfied ? `All ${domain} numbers satisfy the inequality` : `No ${domain} number satisfies the inequality`,
    });
  }

  let boundary = netConstant / netCoefficient;
  let finalOperator = operator;
  if (netCoefficient < 0) {
    boundary = netConstant / netCoefficient;
    finalOperator =
      operator === "<" ? ">" : operator === "<=" ? ">=" : operator === ">" ? "<" : "<=";
  }

  const lowerBound = finalOperator === ">" || finalOperator === ">=" ? boundary : -Infinity;
  const lowerInclusive = finalOperator === ">=";
  const upperBound = finalOperator === "<" || finalOperator === "<=" ? boundary : Infinity;
  const upperInclusive = finalOperator === "<=";

  let finalAnswerText;
  if (domain === "natural" || domain === "whole" || domain === "integer") {
    const discrete = buildDiscreteValuesFromRange({
      domain: domain === "integer" ? "whole" : domain,
      lowerBound,
      lowerInclusive,
      upperBound,
      upperInclusive,
    });

    if (domain === "integer" && discrete.values === null && /all whole numbers/.test(discrete.text)) {
      finalAnswerText = discrete.text.replace("whole", "integer");
    } else if (domain === "integer" && Array.isArray(discrete.values)) {
      const values = [];
      const effectiveStart = Number.isFinite(lowerBound)
        ? Math.ceil(lowerInclusive ? lowerBound : lowerBound + 1e-9)
        : -20;
      const effectiveEnd = Number.isFinite(upperBound)
        ? Math.floor(upperInclusive ? upperBound : upperBound - 1e-9)
        : 20;

      if (!Number.isFinite(lowerBound) || !Number.isFinite(upperBound)) {
        finalAnswerText = `x ${finalOperator} ${formatSolvedNumber(boundary)} for integers`;
      } else {
        for (let current = effectiveStart; current <= effectiveEnd; current += 1) {
          values.push(current);
          if (values.length > 200) break;
        }
        finalAnswerText = values.length ? values.join(", ") : "no integer satisfies the inequality";
      }
    } else {
      finalAnswerText = discrete.text;
    }
  } else {
    finalAnswerText = `x ${finalOperator} ${formatSolvedNumber(boundary)}; solution set ${formatContinuousRange({
      lowerBound,
      lowerInclusive,
      upperBound,
      upperInclusive,
    })}`;
  }

  return buildBasicStemAnswer({
    formula: "Move all x terms to one side and divide by the coefficient, reversing the inequality sign if dividing by a negative number",
    given: `${leftRaw} ${operator} ${rightRaw}; domain: ${domain} numbers`,
    substitution: `${formatSolvedNumber(netCoefficient)}x ${operator} ${formatSolvedNumber(netConstant)}`,
    calculation: `${formatSolvedNumber(netCoefficient)}x ${operator} ${formatSolvedNumber(netConstant)}, so x ${finalOperator} ${formatSolvedNumber(boundary)}.`,
    finalAnswer: finalAnswerText,
  });
};

const solveGenericForceQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text || !/\bforce\b/i.test(text) || !/\bmass\b/i.test(text) || !/\bacceleration\b/i.test(text)) {
    return null;
  }

  const massMatch = text.match(/\bmass\b(?:\s+is|\s*=|\s+of)?\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
  const accelerationMatch = text.match(/\bacceleration\b(?:\s+is|\s*=|\s+of)?\s*(\d+(?:\.\d+)?)\s*(m\/s\^?2|mps\^?2|m\/s2)\b/i);
  if (!massMatch?.[1] || !accelerationMatch?.[1]) {
    return null;
  }

  let mass = Number(massMatch[1]);
  const acceleration = Number(accelerationMatch[1]);
  const massUnit = String(massMatch[2] || "").toLowerCase();

  if (!Number.isFinite(mass) || !Number.isFinite(acceleration)) {
    return null;
  }

  if (massUnit === "g") {
    mass /= 1000;
  }

  const force = mass * acceleration;
  return buildBasicStemAnswer({
    formula: "Force = mass x acceleration",
    given: `mass = ${formatSolvedNumber(mass)} kg, acceleration = ${formatSolvedNumber(acceleration)} m/s^2`,
    substitution: `F = ${formatSolvedNumber(mass)} x ${formatSolvedNumber(acceleration)}`,
    calculation: `F = ${formatSolvedNumber(force)} N`,
    finalAnswer: `${formatSolvedNumber(force)} N`,
  });
};

const solveGenericMolarityQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text || !/\bmolarity\b/i.test(text) || !/\bmoles?\b/i.test(text) || !/\bvolume\b/i.test(text)) {
    return null;
  }

  const molesMatch = text.match(/\bmoles?\b(?:\s+is|\s*=|\s+of)?\s*(\d+(?:\.\d+)?)\b/i);
  const volumeMatch = text.match(/\bvolume\b(?:\s+is|\s*=|\s+of)?\s*(\d+(?:\.\d+)?)\s*(ml|l)\b/i);
  if (!molesMatch?.[1] || !volumeMatch?.[1] || !volumeMatch?.[2]) {
    return null;
  }

  const moles = Number(molesMatch[1]);
  let volume = Number(volumeMatch[1]);
  const volumeUnit = String(volumeMatch[2] || "").toLowerCase();

  if (!Number.isFinite(moles) || !Number.isFinite(volume) || volume === 0) {
    return null;
  }

  if (volumeUnit === "ml") {
    volume /= 1000;
  }

  const molarity = moles / volume;
  return buildBasicStemAnswer({
    formula: "Molarity = number of moles / volume in litres",
    given: `moles = ${formatSolvedNumber(moles)}, volume = ${formatSolvedNumber(volume)} L`,
    substitution: `M = ${formatSolvedNumber(moles)} / ${formatSolvedNumber(volume)}`,
    calculation: `M = ${formatSolvedNumber(molarity)} mol/L`,
    finalAnswer: `${formatSolvedNumber(molarity)} M`,
  });
};

const solveGenericSimpleInterestQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text || !/\bsimple\s+interest\b/i.test(text)) {
    return null;
  }

  const principalMatch =
    text.match(/\b(?:principal|sum|amount)\b(?:\s+is|\s*=|\s+of)?\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i) ||
    text.match(/\b(?:rs\.?|₹)\s*(\d+(?:\.\d+)?)\b/i);
  const rateMatch = text.match(/\b(\d+(?:\.\d+)?)\s*%/i);
  const timeMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(years?|yrs?|yr)\b/i);
  if (!principalMatch?.[1] || !rateMatch?.[1] || !timeMatch?.[1]) {
    return null;
  }

  const principal = Number(principalMatch[1]);
  const rate = Number(rateMatch[1]);
  const time = Number(timeMatch[1]);

  if (![principal, rate, time].every(Number.isFinite)) {
    return null;
  }

  const interest = (principal * rate * time) / 100;
  const amount = principal + interest;
  const asksAmount = /\bamount\b/i.test(text) && !/\bsimple\s+interest\b.*\bfind\b/i.test(text);

  return buildBasicStemAnswer({
    formula: "Simple Interest = (Principal x Rate x Time) / 100",
    given: `Principal = Rs ${formatSolvedNumber(principal)}, Rate = ${formatSolvedNumber(rate)}%, Time = ${formatSolvedNumber(time)} years`,
    substitution: `SI = (${formatSolvedNumber(principal)} x ${formatSolvedNumber(rate)} x ${formatSolvedNumber(time)}) / 100`,
    calculation: `SI = Rs ${formatSolvedNumber(interest)}${asksAmount ? ` and Amount = Rs ${formatSolvedNumber(amount)}` : ""}`,
    finalAnswer: asksAmount ? `Rs ${formatSolvedNumber(amount)}` : `Rs ${formatSolvedNumber(interest)}`,
  });
};

const buildLinearInequalityBound = ({ coefficient, constant, operator }) => {
  if (!Number.isFinite(coefficient) || !Number.isFinite(constant)) {
    return null;
  }

  if (Math.abs(coefficient) < 1e-9) {
    const alwaysTrue =
      operator === ">"
        ? 0 > constant
        : operator === ">="
          ? 0 >= constant
          : operator === "<"
            ? 0 < constant
            : 0 <= constant;

    return {
      alwaysTrue,
      alwaysFalse: !alwaysTrue,
      lowerBound: -Infinity,
      lowerInclusive: false,
      upperBound: Infinity,
      upperInclusive: false,
    };
  }

  let finalOperator = operator;
  let boundary = constant / coefficient;
  if (coefficient < 0) {
    finalOperator =
      operator === ">" ? "<" : operator === ">=" ? "<=" : operator === "<" ? ">" : ">=";
  }

  return {
    alwaysTrue: false,
    alwaysFalse: false,
    lowerBound: finalOperator === ">" || finalOperator === ">=" ? boundary : -Infinity,
    lowerInclusive: finalOperator === ">=",
    upperBound: finalOperator === "<" || finalOperator === "<=" ? boundary : Infinity,
    upperInclusive: finalOperator === "<=",
    finalOperator,
    boundary,
  };
};

const mergeRangeBounds = (current, next) => {
  if (!current || !next) return null;
  if (current.alwaysFalse || next.alwaysFalse) {
    return { alwaysFalse: true };
  }
  if (current.alwaysTrue) return next;
  if (next.alwaysTrue) return current;

  let lowerBound = current.lowerBound;
  let lowerInclusive = current.lowerInclusive;
  if (next.lowerBound > lowerBound) {
    lowerBound = next.lowerBound;
    lowerInclusive = next.lowerInclusive;
  } else if (Math.abs(next.lowerBound - lowerBound) < 1e-9) {
    lowerInclusive = current.lowerInclusive && next.lowerInclusive;
  }

  let upperBound = current.upperBound;
  let upperInclusive = current.upperInclusive;
  if (next.upperBound < upperBound) {
    upperBound = next.upperBound;
    upperInclusive = next.upperInclusive;
  } else if (Math.abs(next.upperBound - upperBound) < 1e-9) {
    upperInclusive = current.upperInclusive && next.upperInclusive;
  }

  if (lowerBound > upperBound || (Math.abs(lowerBound - upperBound) < 1e-9 && (!lowerInclusive || !upperInclusive))) {
    return { alwaysFalse: true };
  }

  return {
    alwaysFalse: false,
    lowerBound,
    lowerInclusive,
    upperBound,
    upperInclusive,
  };
};

const solveSolutionMixtureRangeQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\b(solution|mixture|dilute|diluted|acid|alloy)\b/i.test(text)) {
    return null;
  }
  if ((text.match(/\d+(?:\.\d+)?\s*%/g) || []).length < 4) {
    return null;
  }

  const percentMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((match) => Number(match[1]));
  const volumeMatch =
    text.match(/\b(?:has|have|contains?|with|of)\s+(\d+(?:\.\d+)?)\s*(litres?|liters?|l)\b/i) ||
    text.match(/\bif\s+we\s+have\s+(\d+(?:\.\d+)?)\s*(litres?|liters?|l)\b/i) ||
    text.match(/\b(\d+(?:\.\d+)?)\s*(litres?|liters?|l)\s+of\s+the\s+\d+(?:\.\d+)?%\s+solution\b/i);

  if (percentMatches.length < 4 || !volumeMatch?.[1]) {
    return null;
  }

  const [initialPercent, addedPercent, lowerPercent, upperPercent] = percentMatches;
  const initialVolume = Number(volumeMatch[1]);
  if (![initialPercent, addedPercent, lowerPercent, upperPercent, initialVolume].every(Number.isFinite)) {
    return null;
  }

  const lowerCondition = buildLinearInequalityBound({
    coefficient: addedPercent - lowerPercent,
    constant: (lowerPercent - initialPercent) * initialVolume,
    operator: ">",
  });
  const upperCondition = buildLinearInequalityBound({
    coefficient: addedPercent - upperPercent,
    constant: (upperPercent - initialPercent) * initialVolume,
    operator: "<",
  });
  const nonNegativeCondition = {
    alwaysFalse: false,
    lowerBound: 0,
    lowerInclusive: true,
    upperBound: Infinity,
    upperInclusive: false,
  };

  const merged = mergeRangeBounds(mergeRangeBounds(lowerCondition, upperCondition), nonNegativeCondition);
  if (!merged || merged.alwaysFalse) {
    return buildBasicStemAnswer({
      formula: "Use concentration of solute before and after mixing and solve the resulting inequality",
      given: `Initial volume = ${formatSolvedNumber(initialVolume)} litres, initial concentration = ${initialPercent}%, added concentration = ${addedPercent}%, target range = ${lowerPercent}% to ${upperPercent}%`,
      substitution: `(${initialPercent} x ${formatSolvedNumber(initialVolume)} + ${addedPercent}x) / (${formatSolvedNumber(initialVolume)} + x) is between ${lowerPercent}% and ${upperPercent}%`,
      calculation: "Solving the inequalities gives no valid non-negative value of x.",
      finalAnswer: "No quantity can be added to satisfy the condition",
    });
  }

  const finalAnswer =
    Number.isFinite(merged.lowerBound) && Number.isFinite(merged.upperBound)
      ? `${merged.lowerInclusive ? "[" : "("}${formatSolvedNumber(merged.lowerBound)}, ${formatSolvedNumber(merged.upperBound)}${merged.upperInclusive ? "]" : ")"} litres, i.e. ${formatSolvedNumber(merged.lowerBound)} < x < ${formatSolvedNumber(merged.upperBound)}`
      : `x lies in ${formatContinuousRange(merged)} litres`;

  return buildBasicStemAnswer({
    formula: "Amount of solute after mixing / total volume gives the final concentration",
    given: `Initial volume = ${formatSolvedNumber(initialVolume)} litres, initial concentration = ${initialPercent}%, added concentration = ${addedPercent}%, target range = more than ${lowerPercent}% and less than ${upperPercent}%`,
    substitution: `(${initialPercent} x ${formatSolvedNumber(initialVolume)} + ${addedPercent}x) / (${formatSolvedNumber(initialVolume)} + x) > ${lowerPercent} and < ${upperPercent}`,
    calculation: `Solving the two inequalities together gives ${formatSolvedNumber(merged.lowerBound)} < x < ${formatSolvedNumber(merged.upperBound)}.`,
    finalAnswer,
  });
};

const extractStatisticsDataSet = (question) => {
  const text = String(question || "").trim();
  if (!text) return [];

  const dataMatch =
    text.match(/\b(?:data|observations?|values?)\s*:\s*([^.?]+)/i) ||
    text.match(/\bfollowing\s+data\s*:\s*([^.?]+)/i);
  const source = dataMatch?.[1] || text;

  return [...source.matchAll(/-?\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter(Number.isFinite);
};

const computeMedianFromSortedValues = (sortedValues) => {
  if (!Array.isArray(sortedValues) || !sortedValues.length) return null;

  const middle = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 1) {
    return sortedValues[middle];
  }

  return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
};

const solveMeanDeviationQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text || !/\bmean\s+deviation\b/i.test(text)) {
    return null;
  }

  const data = extractStatisticsDataSet(text);
  if (data.length < 2) return null;

  const sorted = [...data].sort((left, right) => left - right);
  const aboutMedian = /\babout\s+the\s+median\b/i.test(text);
  const aboutMean = /\babout\s+the\s+mean\b/i.test(text);

  let centralMeasureLabel = "median";
  let centralValue = computeMedianFromSortedValues(sorted);

  if (aboutMean) {
    centralMeasureLabel = "mean";
    centralValue = data.reduce((sum, value) => sum + value, 0) / data.length;
  } else if (aboutMedian) {
    centralMeasureLabel = "median";
    centralValue = computeMedianFromSortedValues(sorted);
  }

  if (!Number.isFinite(centralValue)) return null;

  const absoluteDeviations = data.map((value) => Math.abs(value - centralValue));
  const totalDeviation = absoluteDeviations.reduce((sum, value) => sum + value, 0);
  const meanDeviation = totalDeviation / data.length;

  return buildBasicStemAnswer({
    formula: `Mean deviation about the ${centralMeasureLabel} = sum of absolute deviations from the ${centralMeasureLabel} / number of observations`,
    given: `Data = ${data.join(", ")}`,
    substitution: `${centralMeasureLabel} = ${formatSolvedNumber(centralValue)}; MD = (${absoluteDeviations.map((value) => formatSolvedNumber(value)).join(" + ")}) / ${data.length}`,
    calculation: `Sorted data = ${sorted.join(", ")}. ${centralMeasureLabel} = ${formatSolvedNumber(centralValue)}. Sum of absolute deviations = ${formatSolvedNumber(totalDeviation)}. Therefore mean deviation = ${formatSolvedNumber(meanDeviation)}.`,
    finalAnswer: `${formatSolvedNumber(meanDeviation)} (unit not specified)`,
  });
};

const solveBasicStatisticsQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\b(find|calculate|determine|compute)\b/i.test(text)) return null;

  const data = extractStatisticsDataSet(text);
  if (data.length < 2) return null;

  const sorted = [...data].sort((left, right) => left - right);

  if (/\bmean\b/i.test(text) && !/\bmean\s+deviation\b/i.test(text)) {
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    return buildBasicStemAnswer({
      formula: "Mean = sum of observations / number of observations",
      given: `Data = ${data.join(", ")}`,
      substitution: `Mean = (${data.join(" + ")}) / ${data.length}`,
      calculation: `Sum = ${formatSolvedNumber(data.reduce((sum, value) => sum + value, 0))}, so mean = ${formatSolvedNumber(mean)}.`,
      finalAnswer: `${formatSolvedNumber(mean)} (unit not specified)`,
    });
  }

  if (/\bmedian\b/i.test(text)) {
    const median = computeMedianFromSortedValues(sorted);
    if (!Number.isFinite(median)) return null;

    return buildBasicStemAnswer({
      formula: "Median is the middle observation of the ordered data",
      given: `Data = ${data.join(", ")}`,
      substitution: `Ordered data = ${sorted.join(", ")}`,
      calculation: `The ordered data has ${sorted.length} observations, so the median = ${formatSolvedNumber(median)}.`,
      finalAnswer: `${formatSolvedNumber(median)} (unit not specified)`,
    });
  }

  if (/\bmode\b/i.test(text)) {
    const frequencyMap = new Map();
    for (const value of data) {
      frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
    }

    const maxFrequency = Math.max(...frequencyMap.values());
    const modes = [...frequencyMap.entries()]
      .filter(([, count]) => count === maxFrequency)
      .map(([value]) => value)
      .sort((left, right) => left - right);

    return buildBasicStemAnswer({
      formula: "Mode is the observation with the highest frequency",
      given: `Data = ${data.join(", ")}`,
      substitution: [...frequencyMap.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([value, count]) => `${formatSolvedNumber(value)} occurs ${count} times`)
        .join("; "),
      calculation: `The highest frequency is ${maxFrequency}, so the mode ${modes.length > 1 ? "values are" : "is"} ${modes.map((value) => formatSolvedNumber(value)).join(", ")}.`,
      finalAnswer: `${modes.map((value) => formatSolvedNumber(value)).join(", ")} (unit not specified)`,
    });
  }

  return null;
};

const solveVarianceOrStandardDeviationQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\b(variance|standard\s+deviation)\b/i.test(text)) return null;

  const data = extractStatisticsDataSet(text);
  if (data.length < 2) return null;

  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  const squaredDeviations = data.map((value) => (value - mean) ** 2);
  const variance = squaredDeviations.reduce((sum, value) => sum + value, 0) / data.length;
  const standardDeviation = Math.sqrt(variance);

  if (/\bvariance\b/i.test(text)) {
    return buildBasicStemAnswer({
      formula: "Variance = sum of squared deviations from the mean / number of observations",
      given: `Data = ${data.join(", ")}`,
      substitution: `Mean = ${formatSolvedNumber(mean)}; Variance = (${squaredDeviations.map((value) => formatSolvedNumber(value)).join(" + ")}) / ${data.length}`,
      calculation: `Mean = ${formatSolvedNumber(mean)}. Sum of squared deviations = ${formatSolvedNumber(squaredDeviations.reduce((sum, value) => sum + value, 0))}. Therefore variance = ${formatSolvedNumber(variance)}.`,
      finalAnswer: `${formatSolvedNumber(variance)} (unit not specified)`,
    });
  }

  return buildBasicStemAnswer({
    formula: "Standard deviation = square root of variance",
    given: `Data = ${data.join(", ")}`,
    substitution: `Mean = ${formatSolvedNumber(mean)}; Variance = (${squaredDeviations.map((value) => formatSolvedNumber(value)).join(" + ")}) / ${data.length}`,
    calculation: `Mean = ${formatSolvedNumber(mean)}. Variance = ${formatSolvedNumber(variance)}. Therefore standard deviation = ${formatSolvedNumber(standardDeviation)}.`,
    finalAnswer: `${formatSolvedNumber(standardDeviation)} (unit not specified)`,
  });
};

const parseNamedSetElements = (question) => {
  const text = normalizeQuestionForSolver(question);
  const namedSets = new Map();

  for (const match of text.matchAll(/\b([A-Z])\s*=\s*[\{\(]([^}\)]*)[\}\)]/g)) {
    const name = String(match[1] || "").toUpperCase();
    const elements = String(match[2] || "")
      .split(",")
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    namedSets.set(name, elements);
  }

  return namedSets;
};

const solveSubsetQuestionWithNamedSets = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\bsubset\b|[⊂⊆]/i.test(text)) return null;

  const namedSets = parseNamedSetElements(text);
  if (namedSets.size < 2) return null;

  const relations = [
    ...text.matchAll(/\b([A-Z])\s+(?:is\s+)?a\s+subset\s+of\s+([A-Z])\b/gi),
    ...text.matchAll(/\b([A-Z])\s*([⊂⊆])\s*([A-Z])\b/g),
  ];
  if (!relations.length) return null;

  const answers = [];
  for (const relation of relations) {
    const leftName = String(relation[1] || "").toUpperCase();
    const rightName = String(relation[2] === "⊂" || relation[2] === "⊆" ? relation[3] : relation[2] || "").toUpperCase();
    const leftSet = namedSets.get(leftName);
    const rightSet = namedSets.get(rightName);
    if (!leftSet || !rightSet) continue;

    const missingElements = leftSet.filter((value) => !rightSet.includes(value));
    const isSubset = missingElements.length === 0;
    const reason = isSubset
      ? `Every element of ${leftName} belongs to ${rightName}.`
      : `${leftName} is not a subset of ${rightName} because ${missingElements.join(", ")} ${missingElements.length === 1 ? "does" : "do"} not belong to ${rightName}.`;

    answers.push({
      relation: `${leftName} subset ${rightName}`,
      result: isSubset ? "Yes" : "No",
      reason,
    });
  }

  if (!answers.length) return null;

  return buildBasicStemAnswer({
    formula: "A is a subset of B if every element of A belongs to B",
    given: [...namedSets.entries()].map(([name, elements]) => `${name} = {${elements.join(", ")}}`).join("; "),
    substitution: answers.map((item) => item.relation).join("; "),
    calculation: answers.map((item) => `${item.result}. ${item.reason}`).join(" "),
    finalAnswer: answers.map((item) => `${item.result}. ${item.reason}`).join(" "),
  });
};

const solveSubsetTransitivityQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\bthree\s+sets\b/i.test(text) && !/\bsubset\b|[⊂⊆]/i.test(text)) return null;
  if (!/A\s*[⊂⊆]\s*B/i.test(text) && !/\bA\s+\w*\s*subset\s+of\s+B\b/i.test(text)) return null;
  if (!/B\s*[⊂⊆]\s*C/i.test(text) && !/\bB\s+\w*\s*subset\s+of\s+C\b/i.test(text)) return null;
  if (!/A\s*[⊂⊆]\s*C/i.test(text) && !/\bA\s+\w*\s*subset\s+of\s+C\b/i.test(text)) return null;

  return buildBasicStemAnswer({
    formula: "Subset relation is transitive: if A subset B and B subset C, then A subset C",
    given: "A subset B and B subset C",
    substitution: "Every element of A is in B, and every element of B is in C",
    calculation: "So every element of A must also be in C. Therefore A is a subset of C.",
    finalAnswer: "Yes. A is a subset of C.",
  });
};

const solveOrderedPairEqualityQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\(\s*[^,]+,\s*[^)]+\)\s*=\s*\(\s*[^,]+,\s*[^)]+\)/.test(text)) {
    return null;
  }

  const match = text.match(
    /\(\s*([^) ,]+(?:\s*[+\-]\s*\d+)?)\s*,\s*([^) ,]+(?:\s*[+\-]\s*\d+)?)\s*\)\s*=\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/
  );
  if (!match) return null;

  const solveComponent = (expression, targetValue, variableName) => {
    const normalized = String(expression || "").replace(/\s+/g, "");
    const directVariableMatch = normalized.match(new RegExp(`^${variableName}$`, "i"));
    if (directVariableMatch) {
      return {
        equation: `${variableName} = ${targetValue}`,
        value: Number(targetValue),
      };
    }

    const shiftedMatch = normalized.match(new RegExp(`^${variableName}([+-])(\\d+(?:\\.\\d+)?)$`, "i"));
    if (!shiftedMatch) return null;

    const operator = shiftedMatch[1];
    const constant = Number(shiftedMatch[2]);
    if (!Number.isFinite(constant)) return null;

    const numericTarget = Number(targetValue);
    if (!Number.isFinite(numericTarget)) return null;

    const value = operator === "+" ? numericTarget - constant : numericTarget + constant;
    return {
      equation: `${normalized} = ${targetValue}`,
      value,
    };
  };

  const xSolve = solveComponent(match[1], match[3], "x");
  const ySolve = solveComponent(match[2], match[4], "y");
  if (!xSolve || !ySolve) {
    return null;
  }

  return buildBasicStemAnswer({
    formula: "If two ordered pairs are equal, then their corresponding components are equal",
    given: `(${match[1]}, ${match[2]}) = (${match[3]}, ${match[4]})`,
    substitution: `${xSolve.equation} and ${ySolve.equation}`,
    calculation: `From ${xSolve.equation}, x = ${formatSolvedNumber(xSolve.value)}. From ${ySolve.equation}, y = ${formatSolvedNumber(ySolve.value)}.`,
    finalAnswer: `x = ${formatSolvedNumber(xSolve.value)}, y = ${formatSolvedNumber(ySolve.value)}`,
  });
};

const intersectSets = (left = [], right = []) => {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
};

const cartesianProduct = (left = [], right = []) => {
  const pairs = [];
  for (const leftValue of left) {
    for (const rightValue of right) {
      pairs.push(`(${leftValue}, ${rightValue})`);
    }
  }
  return pairs;
};

const solveCartesianProductQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/[×x*]/i.test(text) || !/\bset\b|\bsets\b/i.test(text)) {
    return null;
  }

  const namedSets = parseNamedSetElements(text);

  const cardinalityMatch = text.match(
    /\bset\s+([A-Z])\s+has\s+(\d+)\s+elements?\b/i
  );
  if (cardinalityMatch?.[1] && cardinalityMatch?.[2]) {
    const setName = String(cardinalityMatch[1]).toUpperCase();
    const count = Number(cardinalityMatch[2]);
    if (Number.isFinite(count) && !namedSets.has(setName)) {
      namedSets.set(setName, Array.from({ length: count }, (_, index) => `${setName}${index + 1}`));
    }
  }

  const countQuestionMatch = text.match(
    /\bnumber\s+of\s+elements\s+in\s*\(\s*([A-Z])\s*[×x*]\s*([A-Z])\s*\)/i
  );
  if (countQuestionMatch?.[1] && countQuestionMatch?.[2]) {
    const leftName = String(countQuestionMatch[1]).toUpperCase();
    const rightName = String(countQuestionMatch[2]).toUpperCase();
    const leftSet = namedSets.get(leftName);
    const rightSet = namedSets.get(rightName);
    if (leftSet && rightSet) {
      const count = leftSet.length * rightSet.length;
      return buildBasicStemAnswer({
        formula: "For finite sets, n(A x B) = n(A) x n(B)",
        given: `n(${leftName}) = ${leftSet.length}, n(${rightName}) = ${rightSet.length}`,
        substitution: `n(${leftName} x ${rightName}) = ${leftSet.length} x ${rightSet.length}`,
        calculation: `n(${leftName} x ${rightName}) = ${count}`,
        finalAnswer: `${count} (unit not specified)`,
      });
    }
  }

  const explicitProducts = [...text.matchAll(/\b([A-Z])\s*[×x*]\s*([A-Z])\b/g)];
  if (explicitProducts.length && namedSets.size >= 2 && /\bfind\b/i.test(text)) {
    const answers = [];
    for (const match of explicitProducts) {
      const leftName = String(match[1]).toUpperCase();
      const rightName = String(match[2]).toUpperCase();
      const leftSet = namedSets.get(leftName);
      const rightSet = namedSets.get(rightName);
      if (!leftSet || !rightSet) continue;

      const product = cartesianProduct(leftSet, rightSet);
      answers.push(`${leftName} x ${rightName} = {${product.join(", ")}}`);
    }

    if (answers.length) {
      return buildBasicStemAnswer({
        formula: "Cartesian product A x B is the set of all ordered pairs (a, b) where a belongs to A and b belongs to B",
        given: [...namedSets.entries()].map(([name, elements]) => `${name} = {${elements.join(", ")}}`).join("; "),
        substitution: answers.map((item) => item.split(" = ")[0]).join("; "),
        calculation: answers.join("; "),
        finalAnswer: answers.join("; "),
      });
    }
  }

  const verifyMatch = text.match(
    /\b([A-Z])\s*[×x*]\s*\(\s*([A-Z])\s*∩\s*([A-Z])\s*\)\s*=\s*\(\s*\1\s*[×x*]\s*\2\s*\)\s*∩\s*\(\s*\1\s*[×x*]\s*\3\s*\)/i
  );
  if (verifyMatch?.[1] && verifyMatch?.[2] && verifyMatch?.[3]) {
    const leftName = String(verifyMatch[1]).toUpperCase();
    const middleLeftName = String(verifyMatch[2]).toUpperCase();
    const middleRightName = String(verifyMatch[3]).toUpperCase();
    const leftSet = namedSets.get(leftName);
    const middleLeft = namedSets.get(middleLeftName);
    const middleRight = namedSets.get(middleRightName);
    if (leftSet && middleLeft && middleRight) {
      const intersection = intersectSets(middleLeft, middleRight);
      const lhs = cartesianProduct(leftSet, intersection);
      const axb = cartesianProduct(leftSet, middleLeft);
      const axc = cartesianProduct(leftSet, middleRight);
      const rhs = axb.filter((pair) => axc.includes(pair));
      const equal = lhs.length === rhs.length && lhs.every((pair, index) => pair === rhs[index]);

      return buildBasicStemAnswer({
        formula: "A x (B ∩ C) contains ordered pairs whose first element is from A and second element is common to B and C",
        given: [...namedSets.entries()].map(([name, elements]) => `${name} = {${elements.join(", ")}}`).join("; "),
        substitution: `${middleLeftName} ∩ ${middleRightName} = {${intersection.join(", ")}}`,
        calculation: `LHS = ${leftName} x (${middleLeftName} ∩ ${middleRightName}) = {${lhs.join(", ")}}. RHS = (${leftName} x ${middleLeftName}) ∩ (${leftName} x ${middleRightName}) = {${rhs.join(", ")}}.`,
        finalAnswer: equal ? `Verified. Both sides are {${lhs.join(", ")}}.` : "Not verified.",
      });
    }
  }

  return null;
};

const solveBasicTrigonometricExpressionQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\b(sin|cos|tan|cot|sec|cosec)\b/i.test(text)) return null;

  const compact = text.toLowerCase().replace(/\s+/g, "");

  if (/sin\^?2x\+cos\^?2x=?\??$/.test(compact) || /cos\^?2x\+sin\^?2x=?\??$/.test(compact)) {
    return buildBasicStemAnswer({
      formula: "sin^2 x + cos^2 x = 1",
      given: "Expression = sin^2 x + cos^2 x",
      substitution: "sin^2 x + cos^2 x = 1",
      calculation: "Using the fundamental trigonometric identity, the value is 1.",
      finalAnswer: "1 (unit not specified)",
    });
  }

  if (/1\+tan\^?2x=?\??$/.test(compact) || /tan\^?2x\+1=?\??$/.test(compact)) {
    return buildBasicStemAnswer({
      formula: "1 + tan^2 x = sec^2 x",
      given: "Expression = 1 + tan^2 x",
      substitution: "1 + tan^2 x = sec^2 x",
      calculation: "Using the standard trigonometric identity, the expression simplifies to sec^2 x.",
      finalAnswer: "sec^2 x (unit not specified)",
    });
  }

  if (/1\+cot\^?2x=?\??$/.test(compact) || /cot\^?2x\+1=?\??$/.test(compact)) {
    return buildBasicStemAnswer({
      formula: "1 + cot^2 x = cosec^2 x",
      given: "Expression = 1 + cot^2 x",
      substitution: "1 + cot^2 x = cosec^2 x",
      calculation: "Using the standard trigonometric identity, the expression simplifies to cosec^2 x.",
      finalAnswer: "cosec^2 x (unit not specified)",
    });
  }

  if (/sec\^?2x-tan\^?2x=?\??$/.test(compact) || /sec\^?2x\-\s*tan\^?2x=?\??$/.test(compact)) {
    return buildBasicStemAnswer({
      formula: "sec^2 x - tan^2 x = 1",
      given: "Expression = sec^2 x - tan^2 x",
      substitution: "sec^2 x - tan^2 x = 1",
      calculation: "Using the standard trigonometric identity, the value is 1.",
      finalAnswer: "1 (unit not specified)",
    });
  }

  if (/cosec\^?2x-cot\^?2x=?\??$/.test(compact) || /cosec\^?2x\-\s*cot\^?2x=?\??$/.test(compact)) {
    return buildBasicStemAnswer({
      formula: "cosec^2 x - cot^2 x = 1",
      given: "Expression = cosec^2 x - cot^2 x",
      substitution: "cosec^2 x - cot^2 x = 1",
      calculation: "Using the standard trigonometric identity, the value is 1.",
      finalAnswer: "1 (unit not specified)",
    });
  }

  if ((/\bcos\s*x\s*\+\s*sin\s*x\b/i.test(text) || /\bsin\s*x\s*\+\s*cos\s*x\b/i.test(text)) && /[=?]/.test(text)) {
    return buildBasicStemAnswer({
      formula: "sin x + cos x = sqrt(2) sin(x + pi/4) = sqrt(2) cos(x - pi/4)",
      given: "Expression = sin x + cos x",
      substitution: "sin x + cos x = sqrt(2) sin(x + pi/4)",
      calculation: "Without a specific value of x, the expression cannot be reduced to one number. Its simplified form is sqrt(2) sin(x + pi/4), and its range is from -sqrt(2) to sqrt(2).",
      finalAnswer: "sqrt(2) sin(x + pi/4); range [-sqrt(2), sqrt(2)]",
    });
  }

  if ((/\bcos\s*x\s*\-\s*sin\s*x\b/i.test(text) || /\bsin\s*x\s*\-\s*cos\s*x\b/i.test(text)) && /[=?]/.test(text)) {
    const finalAnswer = /\bcos\s*x\s*\-\s*sin\s*x\b/i.test(text)
      ? "sqrt(2) cos(x + pi/4); range [-sqrt(2), sqrt(2)]"
      : "sqrt(2) sin(x - pi/4); range [-sqrt(2), sqrt(2)]";

    return buildBasicStemAnswer({
      formula: "Use sum/difference transformation identities",
      given: /\bcos\s*x\s*\-\s*sin\s*x\b/i.test(text)
        ? "Expression = cos x - sin x"
        : "Expression = sin x - cos x",
      substitution: /\bcos\s*x\s*\-\s*sin\s*x\b/i.test(text)
        ? "cos x - sin x = sqrt(2) cos(x + pi/4)"
        : "sin x - cos x = sqrt(2) sin(x - pi/4)",
      calculation: "Without a specific value of x, the expression is written in simplified trigonometric form, and its range is from -sqrt(2) to sqrt(2).",
      finalAnswer,
    });
  }

  return null;
};

const findSingleVariableRoot = (evaluate) => {
  let previousX = null;
  let previousY = null;

  for (let index = -400; index <= 400; index += 1) {
    const x = index / 4;
    let y;
    try {
      y = evaluate(x);
    } catch {
      continue;
    }

    if (!Number.isFinite(y)) {
      continue;
    }

    if (Math.abs(y) < 1e-9) {
      return x;
    }

    if (previousY !== null && previousX !== null && previousY * y < 0) {
      let left = previousX;
      let right = x;
      let leftY = previousY;
      let rightY = y;

      for (let i = 0; i < 80; i += 1) {
        const middle = (left + right) / 2;
        let middleY;
        try {
          middleY = evaluate(middle);
        } catch {
          break;
        }

        if (!Number.isFinite(middleY)) {
          break;
        }

        if (Math.abs(middleY) < 1e-9) {
          return middle;
        }

        if (leftY * middleY < 0) {
          right = middle;
          rightY = middleY;
        } else {
          left = middle;
          leftY = middleY;
        }
      }

      return (left + right) / 2;
    }

    previousX = x;
    previousY = y;
  }

  return null;
};

const solveSingleVariableEquationQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (!/\bsolve\s+for\s+x\b/i.test(text) && !/x/i.test(text)) {
    return null;
  }

  const match = text.match(/([0-9xX+\-*/().^\s]+=[0-9xX+\-*/().^\s]+)/);
  if (!match?.[1]) return null;

  const rawEquation = String(match[1]).trim();
  const [leftRaw, rightRaw] = rawEquation.split("=");
  if (!leftRaw || !rightRaw) return null;

  const leftExpression = normalizeEquationForEvaluation(leftRaw);
  const rightExpression = normalizeEquationForEvaluation(rightRaw);

  if (
    !/^[0-9x+\-*/().]+(?:\*\*)?[0-9x+\-*/().]*$/i.test(leftExpression) ||
    !/^[0-9x+\-*/().]+(?:\*\*)?[0-9x+\-*/().]*$/i.test(rightExpression)
  ) {
    return null;
  }

  let evaluate;
  try {
    evaluate = Function(
      "x",
      `"use strict"; return ((${leftExpression}) - (${rightExpression}));`
    );
  } catch {
    return null;
  }

  const root = findSingleVariableRoot(evaluate);
  if (root === null || !Number.isFinite(root)) {
    return null;
  }

  const solvedX = formatSolvedNumber(root);

  return buildBasicStemAnswer({
    formula: `Set both sides equal and solve the equation ${rawEquation}`,
    given: rawEquation,
    substitution: `${leftRaw.trim()} = ${rightRaw.trim()}`,
    calculation: `Solving the equation gives x = ${solvedX}.`,
    finalAnswer: `x = ${solvedX} (unit not specified)`,
  });
};

const solveAssignedVariableArithmeticQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const assignmentMatches = [...text.matchAll(/\b([a-z])\s*=\s*(-?\d+(?:\.\d+)?)\b/gi)];
  if (!assignmentMatches.length) return null;

  const values = new Map();
  for (const match of assignmentMatches) {
    values.set(String(match[1]).toLowerCase(), Number(match[2]));
  }

  const expressionMatch =
    text.match(/\bfind\s+([a-z0-9+\-*/().\s]+?)\s*=\s*\?/i) ||
    text.match(/\bfind\s+([a-z0-9+\-*/().\s]+)$/i);

  if (!expressionMatch?.[1]) return null;

  let expression = String(expressionMatch[1] || "")
    .replace(/\band\b/gi, " ")
    .replace(/\s+/g, "")
    .toLowerCase();

  if (!expression || !/[a-z]/i.test(expression)) return null;

  for (const [variable, numericValue] of values.entries()) {
    expression = expression.replace(
      new RegExp(`\\b${variable}\\b`, "g"),
      `(${numericValue})`
    );
  }

  if (!/^[0-9+\-*/().]+$/.test(expression)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${expression});`)();
    if (!Number.isFinite(result)) return null;

    const givenText = [...values.entries()]
      .map(([variable, numericValue]) => `${variable} = ${numericValue}`)
      .join(", ");

    return buildBasicStemAnswer({
      formula: "Substitute the given variable values into the expression",
      given: givenText,
      substitution: expression,
      calculation: `${expression} = ${formatSolvedNumber(result)}`,
      finalAnswer: `${formatSolvedNumber(result)} (unit not specified)`,
    });
  } catch {
    return null;
  }
};

const solveTrigonometricVerificationQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const tanMatch = text.match(/\btan\s+([a-z])\s*=\s*(-?\d+(?:\.\d+)?)\b/i);
  const verifyMatch = text.match(
    /\bverify\s+that\s+2\s*sin\s+([a-z])\s*cos\s+\1\s*=\s*(-?\d+(?:\.\d+)?)\b/i
  );

  if (!tanMatch || !verifyMatch) return null;

  const angleName = String(tanMatch[1] || "").toUpperCase();
  const tanValue = Number(tanMatch[2]);
  const expectedValue = Number(verifyMatch[2]);

  if (!Number.isFinite(tanValue) || !Number.isFinite(expectedValue)) {
    return null;
  }

  const lhsValue = (2 * tanValue) / (1 + tanValue * tanValue);
  if (!Number.isFinite(lhsValue)) {
    return null;
  }

  const matches = Math.abs(lhsValue - expectedValue) < 1e-9;

  return buildBasicStemAnswer({
    formula: "If tan A = t, then 2 sin A cos A = 2t / (1 + t^2)",
    given: `tan ${angleName} = ${tanValue}`,
    substitution: `2 sin ${angleName} cos ${angleName} = 2(${tanValue}) / (1 + ${tanValue}^2)`,
    calculation: `2 sin ${angleName} cos ${angleName} = ${formatSolvedNumber(lhsValue)}`,
    finalAnswer: matches
      ? `${formatSolvedNumber(lhsValue)} = ${formatSolvedNumber(expectedValue)}, so verified`
      : `${formatSolvedNumber(lhsValue)} != ${formatSolvedNumber(expectedValue)}, so not verified`,
  });
};

const solveRectangleDimensionsQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const match = text.match(
    /\blength\s+of\s+(?:a|the)?\s*rectangle\s+is\s+(\d+(?:\.\d+)?)\s*(m|cm|mm|km)?\s*more\s+than\s+its\s+breadth\b[\s\S]*?\bperimeter\s+of\s+(?:the\s+)?rectangle\s+is\s+(\d+(?:\.\d+)?)\s*(m|cm|mm|km)?/i
  );
  if (!match) return null;

  const difference = Number(match[1]);
  const diffUnit = match[2] || "";
  const perimeter = Number(match[3]);
  const perimeterUnit = match[4] || diffUnit || "";

  if (!Number.isFinite(difference) || !Number.isFinite(perimeter)) {
    return null;
  }

  const breadth = perimeter / 4 - difference / 2;
  const length = breadth + difference;

  if (!Number.isFinite(length) || !Number.isFinite(breadth)) {
    return null;
  }

  const unit = perimeterUnit || diffUnit || "unit not specified";
  const unitSuffix = unit === "unit not specified" ? unit : unit;

  return buildBasicStemAnswer({
    formula: "Perimeter of rectangle = 2(length + breadth)",
    given: `Perimeter = ${perimeter} ${unitSuffix}, length = breadth + ${difference} ${diffUnit || unitSuffix}`,
    substitution: `2[(x + ${difference}) + x] = ${perimeter}`,
    calculation: `2(2x + ${difference}) = ${perimeter}, so 4x + ${2 * difference} = ${perimeter}, 4x = ${perimeter - 2 * difference}, x = ${breadth}. Therefore breadth = ${breadth} and length = ${length}.`,
    finalAnswer:
      unit === "unit not specified"
        ? `Breadth = ${breadth}, Length = ${length} (${unit})`
        : `Breadth = ${breadth} ${unit}, Length = ${length} ${unit}`,
  });
};

const solveHalfPerimeterRectangleQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const match = text.match(
    /\bhalf\s+the\s+perimeter\b[\s\S]*?\blength\s+is\s+(\d+(?:\.\d+)?)\s*(m|cm|mm|km)?\s+more\s+than\s+(?:its\s+)?width\b[\s\S]*?\bis\s+(\d+(?:\.\d+)?)\s*(m|cm|mm|km)?/i
  );
  if (!match) return null;

  const difference = Number(match[1]);
  const diffUnit = match[2] || "";
  const halfPerimeter = Number(match[3]);
  const halfPerimeterUnit = match[4] || diffUnit || "";

  if (!Number.isFinite(difference) || !Number.isFinite(halfPerimeter)) {
    return null;
  }

  const width = (halfPerimeter - difference) / 2;
  const length = width + difference;
  if (!Number.isFinite(width) || !Number.isFinite(length)) {
    return null;
  }

  const unit = halfPerimeterUnit || diffUnit || "unit not specified";

  return buildBasicStemAnswer({
    formula: "Half perimeter of a rectangle = length + width",
    given: `Half perimeter = ${halfPerimeter} ${unit}, length = width + ${difference} ${diffUnit || unit}`,
    substitution: `(x + ${difference}) + x = ${halfPerimeter}`,
    calculation: `2x + ${difference} = ${halfPerimeter}, so 2x = ${halfPerimeter - difference}, x = ${formatSolvedNumber(width)}. Therefore width = ${formatSolvedNumber(width)} and length = ${formatSolvedNumber(length)}.`,
    finalAnswer:
      unit === "unit not specified"
        ? `Width = ${formatSolvedNumber(width)}, Length = ${formatSolvedNumber(length)} (${unit})`
        : `Width = ${formatSolvedNumber(width)} ${unit}, Length = ${formatSolvedNumber(length)} ${unit}`,
  });
};

const solvePrizeDistributionQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const match = text.match(
    /\b(?:sum|amount)\s+of\s+\$?(\d+(?:\.\d+)?)\s+is\s+to\s+be\s+given\s+in\s+the\s+form\s+of\s+(\d+)\s+prizes?\b[\s\S]*?\b(?:either|of)\s+\$?(\d+(?:\.\d+)?)\s+or\s+\$?(\d+(?:\.\d+)?)/i
  );
  if (!match) return null;

  const totalAmount = Number(match[1]);
  const totalPrizes = Number(match[2]);
  const firstPrize = Number(match[3]);
  const secondPrize = Number(match[4]);

  if (
    !Number.isFinite(totalAmount) ||
    !Number.isFinite(totalPrizes) ||
    !Number.isFinite(firstPrize) ||
    !Number.isFinite(secondPrize) ||
    firstPrize === secondPrize
  ) {
    return null;
  }

  const firstPrizeCount = (totalAmount - totalPrizes * secondPrize) / (firstPrize - secondPrize);
  const secondPrizeCount = totalPrizes - firstPrizeCount;

  if (!Number.isFinite(firstPrizeCount) || !Number.isFinite(secondPrizeCount)) {
    return null;
  }

  if (!Number.isInteger(firstPrizeCount) || !Number.isInteger(secondPrizeCount)) {
    return null;
  }

  return buildBasicStemAnswer({
    formula: "x + y = total prizes, and first prize amount x + second prize amount y = total amount",
    given: `Total amount = $${totalAmount}, total prizes = ${totalPrizes}, prize values = $${firstPrize} and $${secondPrize}`,
    substitution: `x + y = ${totalPrizes} and ${firstPrize}x + ${secondPrize}y = ${totalAmount}`,
    calculation: `Put y = ${totalPrizes} - x. Then ${firstPrize}x + ${secondPrize}(${totalPrizes} - x) = ${totalAmount}. Solving gives x = ${firstPrizeCount} and y = ${secondPrizeCount}.`,
    finalAnswer: `$${firstPrize} prizes = ${firstPrizeCount}, $${secondPrize} prizes = ${secondPrizeCount}`,
  });
};

const solveComplementaryProbabilityQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const givenMatch = text.match(/\bprobability\s+of\s+([a-z][a-z\s]+?)\s+winning(?:\s+the\s+match)?\s+is\s+(\d+(?:\.\d+)?)\b/i);
  const askMatches = [...text.matchAll(/\bprobability\s+of\s+([a-z][a-z\s]+?)\s+winning(?:\s+the\s+match)?\b/gi)];
  const askMatch = askMatches.length ? askMatches[askMatches.length - 1] : null;

  if (!givenMatch?.[1] || !givenMatch?.[2] || !askMatch?.[1]) return null;

  const knownPerson = String(givenMatch[1]).trim();
  const askedPerson = String(askMatch[1]).trim();
  const knownProbability = Number(givenMatch[2]);

  if (!Number.isFinite(knownProbability)) return null;
  if (knownPerson.toLowerCase() === askedPerson.toLowerCase()) return null;

  const remainingProbability = 1 - knownProbability;

  return buildBasicStemAnswer({
    formula: "Total probability = 1",
    given: `P(${knownPerson}) = ${knownProbability}`,
    substitution: `P(${askedPerson}) = 1 - ${knownProbability}`,
    calculation: `P(${askedPerson}) = ${formatSolvedNumber(remainingProbability)}`,
    finalAnswer: `${formatSolvedNumber(remainingProbability)} (unit not specified)`,
  });
};

const solveCategoryProbabilityQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const totalMatch = text.match(/\bthere\s+are\s+(\d+)\s+students?\b/i);
  const girlsMatch = text.match(/\b(\d+)\s+are\s+girls?\b/i);
  const boysMatch = text.match(/\b(\d+)\s+are\s+boys?\b/i);

  if (!totalMatch?.[1] || !girlsMatch?.[1] || !boysMatch?.[1]) return null;

  const total = Number(totalMatch[1]);
  const girls = Number(girlsMatch[1]);
  const boys = Number(boysMatch[1]);

  if (!Number.isFinite(total) || !Number.isFinite(girls) || !Number.isFinite(boys) || total === 0) {
    return null;
  }

  const girlProbability = girls / total;
  const boyProbability = boys / total;

  return buildBasicStemAnswer({
    formula: "Probability = favourable outcomes / total outcomes",
    given: `Total students = ${total}, girls = ${girls}, boys = ${boys}`,
    substitution: `P(girl) = ${girls}/${total}, P(boy) = ${boys}/${total}`,
    calculation: `P(girl) = ${formatSolvedNumber(girlProbability)} and P(boy) = ${formatSolvedNumber(boyProbability)}`,
    finalAnswer: `P(girl) = ${girls}/${total}, P(boy) = ${boys}/${total}`,
  });
};

const solveAtLeastOneCoinProbabilityQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (!/\bprobability\b/i.test(text) || !/\bat\s+least\s+one\s+(head|tail)\b/i.test(text)) {
    return null;
  }
  if (!/\bcoin/i.test(text) || !/\btoss(?:es|ed)?\b/i.test(text)) {
    return null;
  }

  const coinMatch = text.match(/\b([a-z]+|\d+)\s+(?:different\s+)?coins?\b/i);
  const targetMatch = text.match(/\bat\s+least\s+one\s+(head|tail)\b/i);
  const coinCount = parseWordOrDigitNumber(coinMatch?.[1]);
  const target = String(targetMatch?.[1] || "").toLowerCase();

  if (!Number.isFinite(coinCount) || coinCount <= 0 || !target) {
    return null;
  }

  const favorableProbability = 1 - Math.pow(1 / 2, coinCount);
  const denominator = 2 ** coinCount;
  const numerator = denominator - 1;

  return buildBasicStemAnswer({
    formula: "P(at least one success) = 1 - P(no success)",
    given: `Number of coins = ${coinCount}`,
    substitution: `P(at least one ${target}) = 1 - (1/2)^${coinCount}`,
    calculation: `P(at least one ${target}) = 1 - 1/${denominator} = ${numerator}/${denominator} = ${formatSolvedNumber(favorableProbability)}`,
    finalAnswer: `${numerator}/${denominator} (${formatSolvedNumber(favorableProbability)})`,
  });
};

const solveContainerCategoryProbabilityQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (!/\bcontains\b/i.test(text) || !/\bprobability\b/i.test(text)) {
    if (!/\bcontaining\b/i.test(text) || !/\bprobability\b/i.test(text)) {
      return null;
    }
  }

  const containsMatch =
    text.match(/\bcontains\s+(.+?)(?:\.|If\b|What is\b)/i) ||
    text.match(/\bcontaining\s+(.+?)(?:\.|If\b|What is\b)/i);
  const inventoryText = containsMatch?.[1] || text;
  const countMatches = [
    ...inventoryText.matchAll(/(\d+)\s+([a-z]+(?:\s+[a-z]+)?)\b/gi),
  ];

  if (countMatches.length < 2) return null;

  const categories = [];
  for (const match of countMatches) {
    const count = Number(match[1]);
    const label = String(match[2] || "")
      .toLowerCase()
      .replace(/\b(marbles?|fish|balls?|cards?|discs?)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!Number.isFinite(count)) continue;
    if (!label) continue;
    if (["a", "an", "the", "of", "and", "or"].includes(label)) continue;
    categories.push({ label, count });
  }

  if (categories.length < 2) return null;

  const total = categories.reduce((sum, item) => sum + item.count, 0);
  if (!Number.isFinite(total) || total <= 0) return null;

  const askedLabels = [
    ...new Set(
      [...text.matchAll(/\(\s*[ivx]+\s*\)\s*([a-z]+)\b/gi)].map((match) =>
        String(match[1] || "").toLowerCase()
      )
    ),
  ];

  const selectedCategories = askedLabels.length
    ? categories.filter((item) => askedLabels.includes(item.label))
    : categories;

  if (!selectedCategories.length) return null;

  const substitution = selectedCategories
    .map((item) => `P(${item.label}) = ${item.count}/${total}`)
    .join(", ");
  const calculation = selectedCategories
    .map((item) => `P(${item.label}) = ${formatSolvedNumber(item.count / total)}`)
    .join(" and ");
  const finalAnswer = selectedCategories
    .map((item) => `P(${item.label}) = ${item.count}/${total}`)
    .join(", ");

  return buildBasicStemAnswer({
    formula: "Probability = favourable outcomes / total outcomes",
    given: `${selectedCategories.map((item) => `${item.label} = ${item.count}`).join(", ")}, total = ${total}`,
    substitution,
    calculation,
    finalAnswer,
  });
};

const solveNumberedObjectsProbabilityQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (!/\bnumbered\s+from\s+1\s+to\s+(\d+)\b/i.test(text) || !/\bprobability\b/i.test(text)) {
    return null;
  }

  const totalMatch = text.match(/\bnumbered\s+from\s+1\s+to\s+(\d+)\b/i);
  const total = Number(totalMatch?.[1]);
  if (!Number.isFinite(total) || total <= 0) return null;

  const results = [];

  if (/\btwo\s*-\s*digit\s+number\b|\btwo\s+digit\s+number\b/i.test(text)) {
    const count = Math.max(0, Math.min(total, 99) - 9);
    results.push({ label: "two-digit number", count });
  }

  if (/\bperfect\s+square\s+number\b/i.test(text)) {
    const count = Math.floor(Math.sqrt(total));
    results.push({ label: "perfect square number", count });
  }

  if (/\bdivisible\s+by\s+(\d+)\b/i.test(text)) {
    for (const match of text.matchAll(/\bdivisible\s+by\s+(\d+)\b/gi)) {
      const divisor = Number(match[1]);
      if (!Number.isFinite(divisor) || divisor <= 0) continue;
      results.push({ label: `number divisible by ${divisor}`, count: Math.floor(total / divisor) });
    }
  }

  if (!results.length) return null;

  return buildBasicStemAnswer({
    formula: "Probability = favourable outcomes / total outcomes",
    given: `Total numbered objects = ${total}`,
    substitution: results.map((item) => `P(${item.label}) = ${item.count}/${total}`).join(", "),
    calculation: results.map((item) => `P(${item.label}) = ${formatSolvedNumber(item.count / total)}`).join(" and "),
    finalAnswer: results.map((item) => `P(${item.label}) = ${item.count}/${total}`).join(", "),
  });
};

const normalizeAlgebraText = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const normalizePolynomialNotation = (value) =>
  normalizeAlgebraText(value)
    .replace(/([a-z])\s*(\d+)/gi, "$1^$2")
    .replace(/\s+/g, "");

const canonicalizeMonomial = (value) => {
  const variables = [...String(value || "").matchAll(/([a-z])(?:\^(\d+))?/gi)];
  if (!variables.length) return "";

  const exponentMap = new Map();
  for (const [, variable, exponentText] of variables) {
    const key = String(variable || "").toLowerCase();
    const exponent = exponentText ? Number(exponentText) : 1;
    if (!Number.isFinite(exponent) || exponent <= 0) return "";
    exponentMap.set(key, (exponentMap.get(key) || 0) + exponent);
  }

  return [...exponentMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([variable, exponent]) => (exponent === 1 ? variable : `${variable}^${exponent}`))
    .join("");
};

const parsePolynomialExpression = (expression) => {
  const normalized = normalizePolynomialNotation(expression);
  if (!normalized) return null;

  const terms = normalized.replace(/-/g, "+-").split("+").filter(Boolean);
  if (!terms.length) return null;

  const parsedTerms = [];
  for (const term of terms) {
    const match = term.match(/^([+-]?\d*)(.*)$/i);
    if (!match) return null;

    const rawCoeff = String(match[1] || "");
    const rawVariables = String(match[2] || "");

    let coefficient;
    if (rawCoeff === "" || rawCoeff === "+") coefficient = 1;
    else if (rawCoeff === "-") coefficient = -1;
    else coefficient = Number(rawCoeff);

    if (!Number.isFinite(coefficient)) return null;

    const monomialKey = rawVariables ? canonicalizeMonomial(rawVariables) : "__const__";
    if (!monomialKey) return null;

    parsedTerms.push({ coefficient, key: monomialKey });
  }

  return parsedTerms;
};

const combinePolynomialExpressions = (expressions, multipliers = []) => {
  if (!Array.isArray(expressions) || !expressions.length) return null;

  const termMap = new Map();
  for (let index = 0; index < expressions.length; index += 1) {
    const terms = parsePolynomialExpression(expressions[index]);
    if (!terms?.length) return null;

    const multiplier = Number.isFinite(multipliers[index]) ? multipliers[index] : 1;
    for (const term of terms) {
      termMap.set(term.key, (termMap.get(term.key) || 0) + term.coefficient * multiplier);
    }
  }

  const orderedKeys = [...termMap.keys()].sort((left, right) => {
    if (left === "__const__") return 1;
    if (right === "__const__") return -1;
    return left.localeCompare(right);
  });

  const combinedTerms = orderedKeys
    .map((key) => {
      const coefficient = termMap.get(key);
      if (!coefficient) return "";
      if (key === "__const__") return String(coefficient);
      if (coefficient === 1) return key;
      if (coefficient === -1) return `-${key}`;
      return `${coefficient}${key}`;
    })
    .filter(Boolean);

  if (!combinedTerms.length) return "0";
  return combinedTerms.join(" + ").replace(/\+\s*-/g, "- ");
};

const solveAlgebraicAdditionQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (!/^\s*(add|sum)\s*:/i.test(text)) return null;

  const expressionPart = normalizeAlgebraText(
    text.replace(/^\s*(add|sum)\s*:\s*/i, "").replace(/[.?]\s*$/, "")
  );
  const expressions = expressionPart
    .split(/\s*,\s*/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (expressions.length < 2) return null;

  const finalExpression = combinePolynomialExpressions(expressions);
  if (!finalExpression) return null;

  return buildBasicStemAnswer({
    formula: "Add like terms by combining coefficients of the same variables",
    given: expressions.join("; "),
    substitution: expressions.join(" + "),
    calculation: `Combining like terms gives ${finalExpression}`,
    finalAnswer: finalExpression,
  });
};

const solveAlgebraicSubtractionQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const match = text.match(/^\s*subtract\s+(.+?)\s+from\s+(.+?)[.?]?\s*$/i);
  if (!match) return null;

  const subtractExpression = normalizeAlgebraText(match[1]);
  const fromExpression = normalizeAlgebraText(match[2]);
  if (!subtractExpression || !fromExpression) return null;

  const finalExpression = combinePolynomialExpressions(
    [fromExpression, subtractExpression],
    [1, -1]
  );
  if (!finalExpression) return null;

  return buildBasicStemAnswer({
    formula: "Subtract polynomials by changing the sign of each term in the subtrahend and then combining like terms",
    given: `Minuend = ${fromExpression}; Subtrahend = ${subtractExpression}`,
    substitution: `(${fromExpression}) - (${subtractExpression})`,
    calculation: `Changing signs and combining like terms gives ${finalExpression}`,
    finalAnswer: finalExpression,
  });
};

const solveSpeedDistanceTimeQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const match = text.match(
    /\btravels?\s+(\d+(?:\.\d+)?)\s*(km|m)\s+in\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|minutes?|mins?|min|seconds?|secs?|sec)\b[\s\S]*?\bfind\s+the\s+speed\b/i
  );
  if (!match) return null;

  const distance = Number(match[1]);
  const distanceUnit = String(match[2] || "").toLowerCase();
  const timeValue = Number(match[3]);
  const timeUnit = String(match[4] || "").toLowerCase();

  if (!Number.isFinite(distance) || !Number.isFinite(timeValue) || timeValue === 0) {
    return null;
  }

  let timeInHours = timeValue;
  let finalUnit = `${distanceUnit}/h`;

  if (/^min/.test(timeUnit)) {
    timeInHours = timeValue / 60;
    finalUnit = `${distanceUnit}/h`;
  } else if (/^sec/.test(timeUnit)) {
    if (distanceUnit === "m") {
      finalUnit = "m/s";
      timeInHours = timeValue;
    } else {
      timeInHours = timeValue / 3600;
      finalUnit = `${distanceUnit}/h`;
    }
  } else if (/^h|^hr/.test(timeUnit)) {
    finalUnit = `${distanceUnit}/h`;
  }

  const speed =
    finalUnit === "m/s" ? distance / timeValue : distance / timeInHours;

  if (!Number.isFinite(speed)) {
    return null;
  }

  return buildBasicStemAnswer({
    formula: "Speed = Distance / Time",
    given: `Distance = ${distance} ${distanceUnit}, Time = ${timeValue} ${timeUnit}`,
    substitution:
      finalUnit === "m/s"
        ? `Speed = ${distance} / ${timeValue}`
        : `Speed = ${distance} / ${formatSolvedNumber(timeInHours)}`,
    calculation: `Speed = ${formatSolvedNumber(speed)} ${finalUnit}`,
    finalAnswer: `${formatSolvedNumber(speed)} ${finalUnit}`,
  });
};

const solveFinalVelocityQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const startsFromRest = /\bstarts?\s+from\s+rest\b/i.test(text);
  const match = text.match(
    /\baccelerates?\s+at\s+(\d+(?:\.\d+)?)\s*(m\/s\^?2|m\/s²)\s+for\s+(\d+(?:\.\d+)?)\s*(seconds?|secs?|sec|s)\b[\s\S]*?\bfind\s+the\s+final\s+velocity\b/i
  );
  if (!match || !startsFromRest) return null;

  const acceleration = Number(match[1]);
  const accelerationUnit = match[2] || "m/s^2";
  const time = Number(match[3]);
  const timeUnit = match[4] || "s";

  if (!Number.isFinite(acceleration) || !Number.isFinite(time)) {
    return null;
  }

  const initialVelocity = 0;
  const finalVelocity = initialVelocity + acceleration * time;

  if (!Number.isFinite(finalVelocity)) {
    return null;
  }

  return buildBasicStemAnswer({
    formula: "v = u + at",
    given: `u = 0 m/s, a = ${acceleration} ${accelerationUnit}, t = ${time} ${timeUnit}`,
    substitution: `v = 0 + (${acceleration} × ${time})`,
    calculation: `v = ${formatSolvedNumber(finalVelocity)} m/s`,
    finalAnswer: `${formatSolvedNumber(finalVelocity)} m/s`,
  });
};

const solvePhotoelectricQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const hasThresholdFrequency = /\bthreshold\s+frequency\b/i.test(text);
  const hasWorkFunction = /\bwork\s+function\b/i.test(text);
  const hasStoppingPotential = /\bstopping\s+potential\b/i.test(text);
  const hasWavelength = /\bwavelength\b/i.test(text);

  if (!hasWorkFunction || !hasThresholdFrequency || !hasStoppingPotential || !hasWavelength) {
    return null;
  }

  const workFunctionMatch = text.match(/\bwork\s+function(?:\s+of\s+\w+)?\s+is\s+(\d+(?:\.\d+)?)\s*eV\b/i);
  const stoppingPotentialMatch = text.match(/\bstopping\s+potential\s+of\s+(\d+(?:\.\d+)?)\s*V\b/i);

  if (!workFunctionMatch?.[1] || !stoppingPotentialMatch?.[1]) {
    return null;
  }

  const workFunctionEv = Number(workFunctionMatch[1]);
  const stoppingPotentialV = Number(stoppingPotentialMatch[1]);

  if (!Number.isFinite(workFunctionEv) || !Number.isFinite(stoppingPotentialV)) {
    return null;
  }

  const workFunctionJ = workFunctionEv * ELEMENTARY_CHARGE;
  const thresholdFrequency = workFunctionJ / PLANCK_CONSTANT;
  const photonEnergyEv = workFunctionEv + stoppingPotentialV;
  const photonEnergyJ = photonEnergyEv * ELEMENTARY_CHARGE;
  const wavelengthM = (PLANCK_CONSTANT * SPEED_OF_LIGHT) / photonEnergyJ;
  const wavelengthNm = wavelengthM * 1e9;

  if (
    !Number.isFinite(thresholdFrequency) ||
    !Number.isFinite(wavelengthM) ||
    !Number.isFinite(wavelengthNm)
  ) {
    return null;
  }

  return buildBasicStemAnswer({
    formula: "Threshold frequency: nu0 = phi / h, and photon energy: hc/lambda = phi + eV0",
    given: `phi = ${workFunctionEv} eV, V0 = ${stoppingPotentialV} V`,
    substitution: `nu0 = (${workFunctionEv} x e) / h, and lambda = hc / [(${workFunctionEv} + ${stoppingPotentialV}) x e]`,
    calculation: `nu0 = ${thresholdFrequency.toExponential(6)} Hz. Photon energy = ${formatSolvedNumber(photonEnergyEv)} eV, so lambda = ${wavelengthM.toExponential(6)} m = ${wavelengthNm.toFixed(2)} nm.`,
    finalAnswer: `Threshold frequency = ${thresholdFrequency.toExponential(6)} Hz; Wavelength = ${wavelengthM.toExponential(6)} m (${wavelengthNm.toFixed(2)} nm)`,
  });
};

const solveElectromagneticWaveQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;

  const hasWaveContext =
    /\belectromagnetic\s+wave\b/i.test(text) &&
    /\bfree\s+space\b/i.test(text) &&
    /\bwhat\s+is\s+b\b/i.test(text);

  if (!hasWaveContext) return null;

  const electricFieldMatch = text.match(
    /\bE\s*=\s*(\d+(?:\.\d+)?)\s*([ijkĵîk̂ĵi^j^k^]+)\s*V\/m\b/i
  );
  if (!electricFieldMatch?.[1] || !electricFieldMatch?.[2]) {
    return null;
  }

  const propagationMatch = text.match(/\balong\s+the\s+([xyz])(?:-direction)?\b/i);
  const electricAxis = normalizeVectorAxis(electricFieldMatch[2]);
  const propagationAxis = normalizeVectorAxis(propagationMatch?.[1]);
  const electricField = Number(electricFieldMatch[1]);

  if (!Number.isFinite(electricField) || !electricAxis) {
    return null;
  }

  const magneticField = electricField / SPEED_OF_LIGHT;
  if (!Number.isFinite(magneticField)) {
    return null;
  }

  let magneticDirection = "";
  if (propagationAxis === "x" && electricAxis === "j") magneticDirection = "k";
  if (propagationAxis === "x" && electricAxis === "k") magneticDirection = "j";
  if (propagationAxis === "y" && electricAxis === "k") magneticDirection = "i";
  if (propagationAxis === "y" && electricAxis === "i") magneticDirection = "k";
  if (propagationAxis === "z" && electricAxis === "i") magneticDirection = "j";
  if (propagationAxis === "z" && electricAxis === "j") magneticDirection = "i";

  return buildBasicStemAnswer({
    formula: "For an electromagnetic wave in free space, E = cB, so B = E/c",
    given: `E = ${electricField} ${electricAxis} V/m`,
    substitution: `B = ${electricField} / ${SPEED_OF_LIGHT}`,
    calculation: `B = ${magneticField.toExponential(6)} T${magneticDirection ? ` in ${magneticDirection} direction` : ""}`,
    finalAnswer: `${magneticField.toExponential(6)} ${magneticDirection ? `${magneticDirection} ` : ""}T`,
  });
};

const solveWavelengthBandQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (!/\bwavelength\s+band\b/i.test(text) && !/\bcorresponding\s+wavelength\b/i.test(text)) {
    return null;
  }

  const match = text.match(
    /\b(\d+(?:\.\d+)?)\s*(kHz|MHz|GHz|Hz)\s+to\s+(\d+(?:\.\d+)?)\s*(kHz|MHz|GHz|Hz)\s+band\b/i
  );
  if (!match) return null;

  const lowerFrequencyHz = parseFrequencyToHz(match[1], match[2]);
  const upperFrequencyHz = parseFrequencyToHz(match[3], match[4]);
  if (!Number.isFinite(lowerFrequencyHz) || !Number.isFinite(upperFrequencyHz) || lowerFrequencyHz <= 0 || upperFrequencyHz <= 0) {
    return null;
  }

  const minFrequency = Math.min(lowerFrequencyHz, upperFrequencyHz);
  const maxFrequency = Math.max(lowerFrequencyHz, upperFrequencyHz);
  const maxWavelength = SPEED_OF_LIGHT / minFrequency;
  const minWavelength = SPEED_OF_LIGHT / maxFrequency;

  return buildBasicStemAnswer({
    formula: "Wavelength lambda = c / nu",
    given: `Frequency band = ${match[1]} ${match[2]} to ${match[3]} ${match[4]}`,
    substitution: `lambda_max = ${SPEED_OF_LIGHT} / ${minFrequency}, lambda_min = ${SPEED_OF_LIGHT} / ${maxFrequency}`,
    calculation: `lambda_max = ${formatSolvedNumber(maxWavelength)} m and lambda_min = ${formatSolvedNumber(minWavelength)} m`,
    finalAnswer: `${formatSolvedNumber(minWavelength)} m to ${formatSolvedNumber(maxWavelength)} m`,
  });
};

const solveElectromagneticWaveParametersQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return null;
  if (!/\belectromagnetic\s+wave\b/i.test(text)) return null;
  if (!/\bdetermine\s+b0\s*,?\s*w\s*,?\s*k\s*,?\s*(?:and\s*)?[lλ]\b/i.test(text)) return null;

  const amplitudeMatch = text.match(/\bE0\s*=\s*(\d+(?:\.\d+)?)\s*(N\/C|V\/m)\b/i);
  const frequencyMatch = text.match(/\b(?:frequency\s+is\s+[nf]\s*=|frequency\s*=|n\s*=|f\s*=)\s*(\d+(?:\.\d+)?)\s*(kHz|MHz|GHz|Hz)\b/i);
  if (!amplitudeMatch?.[1] || !frequencyMatch?.[1]) return null;

  const electricAmplitude = Number(amplitudeMatch[1]);
  const electricUnit = amplitudeMatch[2];
  const frequencyHz = parseFrequencyToHz(frequencyMatch[1], frequencyMatch[2]);
  if (!Number.isFinite(electricAmplitude) || !Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return null;
  }

  const magneticAmplitude = electricAmplitude / SPEED_OF_LIGHT;
  const angularFrequency = TWO_PI * frequencyHz;
  const wavelength = SPEED_OF_LIGHT / frequencyHz;
  const waveNumber = TWO_PI / wavelength;

  if (
    !Number.isFinite(magneticAmplitude) ||
    !Number.isFinite(angularFrequency) ||
    !Number.isFinite(wavelength) ||
    !Number.isFinite(waveNumber)
  ) {
    return null;
  }

  return buildBasicStemAnswer({
    formula: "B0 = E0/c, omega = 2*pi*f, lambda = c/f, k = 2*pi/lambda",
    given: `E0 = ${electricAmplitude} ${electricUnit}, f = ${frequencyMatch[1]} ${frequencyMatch[2]}`,
    substitution: `B0 = ${electricAmplitude}/${SPEED_OF_LIGHT}, omega = 2*pi*${frequencyHz}, lambda = ${SPEED_OF_LIGHT}/${frequencyHz}, k = 2*pi/${wavelength}`,
    calculation: `B0 = ${magneticAmplitude.toExponential(6)} T, omega = ${angularFrequency.toExponential(6)} rad/s, k = ${waveNumber.toExponential(6)} rad/m, lambda = ${formatSolvedNumber(wavelength)} m. General expressions: E = E0 sin(kx - omega t), B = B0 sin(kx - omega t).`,
    finalAnswer: `B0 = ${magneticAmplitude.toExponential(6)} T, omega = ${angularFrequency.toExponential(6)} rad/s, k = ${waveNumber.toExponential(6)} rad/m, lambda = ${formatSolvedNumber(wavelength)} m`,
  });
};

const solveComplexLinearEquationQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;

  const parseImplicitCoefficient = (value) => {
    const raw = String(value || "").trim();
    if (raw === "" || raw === "+") return 1;
    if (raw === "-") return -1;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const match = text.match(
    /(?:\bif\s+)?([+-]?(?:\d+(?:\.\d+)?)?)x\s*\+\s*i\s*\(\s*([+-]?(?:\d+(?:\.\d+)?)?)x\s*([+-])\s*y\s*\)\s*=\s*([+-]?\d+(?:\.\d+)?)\s*\+\s*i\s*\(\s*([+-]?\d+(?:\.\d+)?)\s*\)/i
  );
  if (!match) return null;

  const realCoeff = parseImplicitCoefficient(match[1]);
  const imagXCoeff = parseImplicitCoefficient(match[2]);
  const imagOperator = match[3];
  const realValue = Number(match[4]);
  const imagValue = Number(match[5]);

  if (![realCoeff, imagXCoeff, realValue, imagValue].every(Number.isFinite) || realCoeff === 0) {
    return null;
  }

  const x = realValue / realCoeff;
  const y = imagOperator === "-" ? imagXCoeff * x - imagValue : imagValue - imagXCoeff * x;

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return buildBasicStemAnswer({
    formula: "For equal complex numbers, equate real parts and imaginary parts separately",
    given: `${realCoeff}x + i(${imagXCoeff}x ${imagOperator} y) = ${realValue} + i(${imagValue})`,
    substitution: `Real part: ${realCoeff}x = ${realValue}; Imaginary part: ${imagXCoeff}x ${imagOperator} y = ${imagValue}`,
    calculation: `x = ${realValue}/${realCoeff} = ${x}. Then ${imagXCoeff}(${x}) ${imagOperator} y = ${imagValue}, so y = ${y}.`,
    finalAnswer: `x = ${x}, y = ${y}`,
  });
};

const extractDigitPool = (text) => {
  const explicitList = text.match(/\bdigits?\s+((?:\d+\s*,\s*)+\d+)\b/i);
  if (explicitList?.[1]) {
    return explicitList[1]
      .split(/\s*,\s*/)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 9);
  }

  const rangeMatch = text.match(/\bdigits?\s+(\d+)\s+to\s+(\d+)\b/i);
  if (rangeMatch?.[1] && rangeMatch?.[2]) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (Number.isInteger(start) && Number.isInteger(end) && start <= end && start >= 0 && end <= 9) {
      return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }
  }

  return [];
};

const solveEvenNumberFormationQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\bhow\s+many\b/i.test(text) || !/\beven\s+numbers?\b/i.test(text) || !/\bformed?\s+from\s+the\s+digits?\b/i.test(text)) {
    return null;
  }

  const lengthMatch = text.match(/\b(\d+)\s*-\s*digit\b|\b(\d+)\s+digit\b/i);
  const length = Number(lengthMatch?.[1] || lengthMatch?.[2]);
  const digits = extractDigitPool(text);
  if (!Number.isInteger(length) || length <= 0 || digits.length === 0) return null;

  const allowRepeat = /\b(can\s+be\s+repeated|with\s+repetition|repetition\s+is\s+allowed)\b/i.test(text);
  const evenDigits = digits.filter((digit) => digit % 2 === 0);
  if (!evenDigits.length) return null;

  const firstChoices = digits.filter((digit) => digit !== 0);
  if (!firstChoices.length) return null;

  let count = 0;

  if (allowRepeat) {
    const middleChoices = Math.pow(digits.length, Math.max(0, length - 2));
    count = firstChoices.length * middleChoices * evenDigits.length;
    if (length === 1) {
      count = evenDigits.filter((digit) => digit !== 0 || digits.includes(0)).length;
    }
  } else {
    for (const lastDigit of evenDigits) {
      for (const firstDigit of firstChoices) {
        if (length > 1 && firstDigit === lastDigit) continue;
        const used = new Set(length === 1 ? [lastDigit] : [firstDigit, lastDigit]);
        const remaining = digits.filter((digit) => !used.has(digit)).length;
        if (length <= 2) {
          count += 1;
          continue;
        }
        let arrangements = 1;
        for (let slots = 0; slots < length - 2; slots += 1) {
          arrangements *= remaining - slots;
        }
        count += arrangements;
      }
    }
  }

  if (!Number.isFinite(count) || count <= 0) return null;

  return buildBasicStemAnswer({
    formula: allowRepeat
      ? "Total numbers = choices for first digit x choices for middle places x choices for even last digit"
      : "Total numbers = arrangements with an even last digit and no repetition",
    given: `Digits = {${digits.join(", ")}}, required length = ${length}, even last digit`,
    substitution: allowRepeat
      ? `${firstChoices.length} x ${Math.pow(digits.length, Math.max(0, length - 2))} x ${evenDigits.length}`
      : "Count valid first and last digits, then arrange the remaining digits in the middle places",
    calculation: allowRepeat
      ? `Number of valid ${length}-digit even numbers = ${count}`
      : `After enforcing an even last digit and no repetition, the total count is ${count}`,
    finalAnswer: `${count} (unit not specified)`,
  });
};

const solveFixedPrefixArrangementQuestion = (question) => {
  const text = normalizeQuestionForSolver(question);
  if (!text) return null;
  if (!/\bhow\s+many\b/i.test(text) || !/\bstarts?\s+with\b/i.test(text) || !/\bno\s+digit\s+appears?\s+more\s+than\s+once\b/i.test(text)) {
    return null;
  }

  const lengthMatch = text.match(/\b(\d+)\s*-\s*digit\b|\b(\d+)\s+digit\b/i);
  const length = Number(lengthMatch?.[1] || lengthMatch?.[2]);
  if (!Number.isInteger(length) || length <= 0) return null;

  const digits = extractDigitPool(text);
  if (!digits.length) return null;

  const prefixMatch = text.match(/\bstarts?\s+with\s+(\d+)\b/i);
  const prefix = String(prefixMatch?.[1] || "");
  if (!prefix) return null;

  const prefixDigits = prefix.split("").map((digit) => Number(digit));
  if (prefixDigits.some((digit) => !Number.isInteger(digit) || !digits.includes(digit))) return null;
  if (new Set(prefixDigits).size !== prefixDigits.length) return null;
  if (prefixDigits.length > length) return null;

  const remainingSlots = length - prefixDigits.length;
  const availableDigits = digits.filter((digit) => !prefixDigits.includes(digit));
  if (remainingSlots < 0 || availableDigits.length < remainingSlots) return null;

  let count = 1;
  for (let index = 0; index < remainingSlots; index += 1) {
    count *= availableDigits.length - index;
  }

  return buildBasicStemAnswer({
    formula: "Number of arrangements = permutations of the remaining available digits",
    given: `Length = ${length}, prefix = ${prefix}, available digits = {${digits.join(", ")}}, no repetition`,
    substitution: remainingSlots > 0 ? `P(${availableDigits.length}, ${remainingSlots})` : "No remaining places to fill",
    calculation: remainingSlots > 0 ? `${availableDigits.length} x ${Array.from({ length: remainingSlots - 1 }, (_, index) => availableDigits.length - (index + 1)).join(" x ") || "1"} = ${count}` : `Count = ${count}`,
    finalAnswer: `${count} (unit not specified)`,
  });
};

const solveQuestionLocally = (question) =>
  solveInternationalNumberFormattingQuestion(question) ||
  solvePlaceOrFaceValueQuestion(question) ||
  solveArithmeticEqualityQuestion(question) ||
  solveDirectArithmeticQuestion(question) ||
  solveFactorialQuestion(question) ||
  solveConsecutiveNumbersQuestion(question) ||
  solveSimpleLinearInequalityQuestion(question) ||
  solveSingleVariableEquationQuestion(question) ||
  solveComplexLinearEquationQuestion(question) ||
  solveGenericForceQuestion(question) ||
  solveGenericMolarityQuestion(question) ||
  solveGenericSimpleInterestQuestion(question) ||
  solveSolutionMixtureRangeQuestion(question) ||
  solveMeanDeviationQuestion(question) ||
  solveBasicStatisticsQuestion(question) ||
  solveVarianceOrStandardDeviationQuestion(question) ||
  solveSubsetQuestionWithNamedSets(question) ||
  solveSubsetTransitivityQuestion(question) ||
  solveCartesianProductQuestion(question) ||
  solveOrderedPairEqualityQuestion(question) ||
  solveBasicTrigonometricExpressionQuestion(question) ||
  solveEvenNumberFormationQuestion(question) ||
  solveFixedPrefixArrangementQuestion(question) ||
  solveAssignedVariableArithmeticQuestion(question) ||
  solveTrigonometricVerificationQuestion(question) ||
  solveRectangleDimensionsQuestion(question) ||
  solveHalfPerimeterRectangleQuestion(question) ||
  solvePrizeDistributionQuestion(question) ||
  solveComplementaryProbabilityQuestion(question) ||
  solveCategoryProbabilityQuestion(question) ||
  solveAtLeastOneCoinProbabilityQuestion(question) ||
  solveContainerCategoryProbabilityQuestion(question) ||
  solveNumberedObjectsProbabilityQuestion(question) ||
  solveAlgebraicAdditionQuestion(question) ||
  solveAlgebraicSubtractionQuestion(question) ||
  solveSpeedDistanceTimeQuestion(question) ||
  solveFinalVelocityQuestion(question) ||
  solvePhotoelectricQuestion(question) ||
  solveElectromagneticWaveQuestion(question) ||
  solveWavelengthBandQuestion(question) ||
  solveElectromagneticWaveParametersQuestion(question);

const formatContextBlock = ({ chunks = [], metadatas = [] }) =>
  chunks
    .map((chunk, index) => {
      const metadata = metadatas[index] || {};
      const sourcePath = metadata.source_path || metadata.book || "unknown";
      const pageNumber = metadata.page_number ? ` page ${metadata.page_number}` : "";
      return `[Source: ${sourcePath}${pageNumber}]\n${String(chunk || "").trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");

const hasStrictStemFormat = (value) => {
  const text = String(value || "").trim();
  if (!text) return false;

  return (
    /^Formula:\s*.+/im.test(text) &&
    /^Given:\s*.+/im.test(text) &&
    /^Substitution:\s*.+/im.test(text) &&
    /^Calculation:\s*.+/im.test(text) &&
    /^Final Answer:\s*.+/im.test(text)
  );
};

const normalizeGeminiAnswer = (value) =>
  String(value || "")
    .replace(/\r/g, "")
    .replace(/\u200b/g, "")
    .trim();

const collectUntilStepBoundary = (lines, startIndex, extraBoundaries = []) => {
  const collected = [];
  let index = startIndex;

  while (
    index < lines.length &&
    !/^Step\s+\d+:?\s*$/i.test(lines[index]) &&
    !extraBoundaries.some((pattern) => pattern.test(lines[index]))
  ) {
    collected.push(lines[index]);
    index += 1;
  }

  return { text: collected.join("\n").trim(), index };
};

const formatGeminiStepPresentation = (value) => {
  const text = String(value || "");
  if (!/^Step\s+\d+:?/im.test(text) || !/^Explanation:/im.test(text)) {
    return text;
  }

  const finalAnswerIndex = text.search(/^Final Answer:/im);
  const body = finalAnswerIndex >= 0 ? text.slice(0, finalAnswerIndex).trim() : text.trim();
  const finalAnswer = finalAnswerIndex >= 0 ? text.slice(finalAnswerIndex).trim() : "";
  const lines = body.split("\n");
  const blocks = [];
  let pendingExplanation = "";
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const explanationMatch = line.match(/^Explanation:\s*(.*)$/i);
    if (explanationMatch) {
      const firstLine = explanationMatch[1]?.trim();
      const collected = collectUntilStepBoundary(lines, index + 1);
      pendingExplanation = [firstLine, collected.text].filter(Boolean).join("\n").trim();
      index = collected.index;
      continue;
    }

    const stepMatch = line.match(/^Step\s+(\d+):?\s*$/i);
    if (!stepMatch) {
      if (!line.trim()) {
        index += 1;
        continue;
      }
      return text;
    }

    const stepNumber = stepMatch[1];
    index += 1;
    while (index < lines.length && !lines[index].trim()) index += 1;

    let explanation = pendingExplanation;
    let operation = "";
    pendingExplanation = "";

    const stepExplanationMatch = lines[index]?.match(/^Explanation:\s*(.*)$/i);
    if (stepExplanationMatch) {
      const firstLine = stepExplanationMatch[1]?.trim();
      const collectedExplanation = collectUntilStepBoundary(lines, index + 1, [/^Operation:\s*/i]);
      explanation = [firstLine, collectedExplanation.text].filter(Boolean).join("\n").trim();
      index = collectedExplanation.index;

      if (/^Operation:\s*/i.test(lines[index] || "")) {
        const operationFirstLine = lines[index].replace(/^Operation:\s*/i, "").trim();
        const collectedOperation = collectUntilStepBoundary(lines, index + 1);
        operation = [operationFirstLine, collectedOperation.text].filter(Boolean).join("\n").trim();
        index = collectedOperation.index;
      } else {
        const collectedOperation = collectUntilStepBoundary(lines, index);
        operation = collectedOperation.text;
        index = collectedOperation.index;
      }
    } else {
      const collectedOperation = collectUntilStepBoundary(lines, index, [/^Explanation:\s*/i]);
      operation = collectedOperation.text;
      index = collectedOperation.index;

      const trailingExplanationMatch = lines[index]?.match(/^Explanation:\s*(.*)$/i);
      if (!explanation && trailingExplanationMatch) {
        const firstLine = trailingExplanationMatch[1]?.trim();
        const collectedExplanation = collectUntilStepBoundary(lines, index + 1);
        explanation = [firstLine, collectedExplanation.text].filter(Boolean).join("\n").trim();
        index = collectedExplanation.index;
      }
    }

    if (!explanation || !operation) {
      return text;
    }

    blocks.push({ stepNumber, explanation, operation });
  }

  if (!blocks.length) {
    return text;
  }

  const formatted = blocks
    .map(
      ({ stepNumber, explanation, operation }) =>
        `Step ${stepNumber}:\n\nExplanation:\n${explanation}\n\nOperation:\n${operation}`
    )
    .join("\n\n");

  return finalAnswer ? `${formatted}\n\n${finalAnswer}` : formatted;
};

const BOOK_FALLBACK_PATTERNS = [
  /\bit\s+is\s+not\s+provided\s+in\s+the\s+book\b/i,
  /\banswer\s+not\s+found\s+in\s+(?:the\s+)?(?:book|textbook)\b/i,
  /\b(?:not\s+(?:provided|found|available|mentioned|given)|missing)\s+in\s+(?:the\s+)?(?:book|textbook|context)\b/i,
  /\b(?:book|textbook|context)\s+(?:does\s+not|doesn't|did\s+not)\s+(?:provide|contain|mention|include)\b/i,
  /\bno\s+(?:relevant|matching|useful)\s+(?:book|textbook)\s+context\b/i,
  /\bnot\s+available\s+in\s+the\s+provided\s+context\b/i,
  /\bcannot\s+be\s+determined\s+from\s+(?:the\s+)?(?:book|textbook|context)\b/i,
  /\boutside\s+the\s+provided\s+(?:book|textbook|context)\b/i,
];

const WEAK_NON_ANSWER_PATTERNS = [
  /^\s*(?:n\/a|none|unknown|not available)\s*$/i,
  /\bi\s+do\s+not\s+know\b/i,
  /\bno\s+answer\s+(?:found|available)\b/i,
  /\binsufficient\s+book\s+context\b/i,
];

const hasMeaningfulTextbookContext = ({ chunks = [] }) =>
  chunks.some((chunk) => String(chunk || "").replace(/\s+/g, " ").trim().length >= 20);

const isFallbackLikeAnswer = (value) => {
  const text = normalizeGeminiAnswer(value);
  if (!text) return true;
  if (text === STEM_NO_ANSWER_TEXT) return true;

  return [...BOOK_FALLBACK_PATTERNS, ...WEAK_NON_ANSWER_PATTERNS].some((pattern) => pattern.test(text));
};

const isUsableGeminiAnswer = (value) => {
  const text = normalizeGeminiAnswer(value);
  if (!text || isFallbackLikeAnswer(text)) {
    return false;
  }

  return /[A-Za-z0-9]/.test(text);
};

const buildGeneralAcademicSolverPrompt = ({ question, contextText, preferContext = false }) => `You are an expert academic teacher and problem solver.

Your task is to answer the student's question accurately and completely.

Important behavior:
- Answer the exact given question.
- Preserve all mathematical functions, scientific notation, accounting structures, tables, chemistry equations, diagrams, and subject-specific symbols.
- Do not rewrite the question into a different simpler equation.
- Never remove or alter functions such as sin, cos, tan, log, ln, roots, powers, fractions, subscripts, superscripts, units, chemistry notation, physics formulas, or accounting table structures.
- Solve according to the actual subject context.
- This system may provide textbook context, but the textbook may not always contain the exact answer.
- ${preferContext ? "Use the textbook context as support whenever it is useful." : "Use the textbook context as optional support only if it helps."}
- If the textbook does not provide a clear or complete answer, you must still generate the answer using your own subject knowledge.
- Do not say "It is not provided in the book."
- Do not refuse to answer only because the textbook content is incomplete.

Scope:
- The question may belong to Mathematics, Physics, Chemistry, Accountancy (Accounts), or Commerce.
- Handle numerical problems, word problems, theory questions, explanations, definitions, derivations, formula-based questions, accounting entries, and business concepts.

Answering rules:
1. Understand the question properly before answering.
2. If it is a problem-solving question, show a clear step-by-step solution.
3. Include formula, substitution, calculation, and units where they are naturally useful.
4. If it is a theory or explanation question, explain clearly in simple Grade 6 student-friendly language.
5. For Physics and Chemistry, include formulas, laws, and units where relevant.
6. For Mathematics, do not skip important steps.
7. For Accountancy and Commerce, use correct terminology such as debit, credit, assets, liabilities, journal, ledger, capital, revenue, and expense, and format entries properly when needed.
8. If the question is slightly unclear, make a reasonable academic assumption and proceed.
9. Give a clean, well-structured answer.
10. If it is a problem, end with: Final Answer: <answer>
11. Do not force a rigid template like Formula/Given/Substitution unless it is naturally useful.
12. Do not include code fences or unnecessary meta-commentary.

School study question formatting:
- For simple school fill-in-the-blank questions, give the expected textbook-style answer directly. Do not add unnecessary steps.
- If the question asks to write a number in the International System, use commas, place-value formatting, or standard numeral grouping, only convert the number by inserting commas every 3 digits from right to left. Do not perform arithmetic, do not repeat the unformatted input, and return only the correctly formatted number with no label, formula, calculation, or explanation.
- For expanded form questions, remove zero-value place terms. Do not write terms like 0 x 1,000, 0 x 10, + 0, or any other zero-place contribution.
- For Indian-number-system expanded forms, use Indian place-value grouping when helpful. Example: 76,70,905 = 70,00,000 + 6,00,000 + 70,000 + 900 + 5.
- For smallest/largest digit-number and place-value questions, keep the answer short and end with only the required value.
- For place value questions, first identify the requested digit, then use the whole given number. Do not answer using only the last comma-separated group.
- For Indian numbering system place value, count places from right to left as Ones, Tens, Hundreds, Thousands, Ten Thousands, Lakhs, Ten Lakhs, Crores.
- For "place value of 7 in 56,74,56,345", the digit 7 is in the ten lakhs place, so the final answer is 70,00,000.
- For face value questions, the final answer is the digit itself.
- Do not use Formula/Given/Substitution/Calculation format for place value or face value questions.
- Keep school subject answers short, clear, and suitable for students.

Readability rules:
- Keep the same answer, steps, calculations, reasoning, and final result.
- Use simple Grade 6 level words in explanations.
- Prefer common words: use "Check" instead of "Determine", "Find an approximate value" instead of "Estimate", "Find" instead of "Calculate", "Much less" instead of "Significantly less", and "Give a reason" instead of "Provide reasoning".
- Keep explanations short; do not make the answer longer.

Equation and numerical step format:
- For algebra, equation solving, numerical, percentage, fraction, geometry, coordinate, calculus, and formula-based solving, format every mathematical step exactly like this:
Step 1:

Explanation:
<one short line explaining why this operation is used>

Operation:
<equation, formula, substitution, or calculation>
- Continue with Step 2, Step 3, and so on.
- Put each Explanation and Operation inside its matching Step.
- Put only the mathematical work under Operation.
- Show only one mathematical transformation in each Operation.
- If the work needs several transformations, break them into smaller sequential Step/Explanation/Operation blocks.
- Each Operation must represent exactly one logical mathematical action.
- Do not combine multiple transformations or multiple equal-sign changes in one Operation.
- Do not skip intermediate mathematical operations.
- Each Explanation must be one sentence only, short, simple, and directly related to why the operation is used.
- Keep each Explanation within 25 words, using simple Class 6 language.
- Explain any variable, notation, abbreviation, formula, or mathematical symbol the first time it appears.
- Explain operations such as moving terms, combining like terms, simplifying fractions, taking common denominators, applying formulas, substituting values, converting percentages, applying derivative or integration rules, and dividing or multiplying both sides.
- Do not add theory paragraphs, unrelated examples, textbook-style notes, or long explanations.
- Do not use the dollar sign character anywhere in equations, expressions, explanations, or final answers.
- Do not wrap math in dollar signs; write equations as plain readable text.

Textbook Context:
${contextText}

Student Question:
${question}
`;

const buildContextFirstBookPrompt = ({ question, contextText }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText,
    preferContext: true,
  });

const buildExpertAcademicFallbackPrompt = ({ question, contextText }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText,
    preferContext: false,
  });

const buildStemSolverPrompt = ({ question, contextText }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText,
    preferContext: true,
  });

const buildStrictDerivationPrompt = ({ question }) => `${STRICT_DERIVATION_PROMPT}

Question:
${question}
`;

const buildDirectNumericalSolverPrompt = ({ question }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText: "No reliable textbook context was retrieved. Answer directly using subject knowledge.",
    preferContext: false,
  });

const buildStrictUniversalSolverPrompt = ({ question }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText: "Answer directly using standard school subject knowledge.",
    preferContext: false,
  });

const buildForcedDirectSubjectSolverPrompt = ({ question }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText: "Answer directly from the student's question using expert academic subject knowledge.",
    preferContext: false,
  });

const buildDirectSubjectTheoryPrompt = ({ question }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText: "Answer as a clear academic teacher. Use subject knowledge directly.",
    preferContext: false,
  });

const buildFallbackSubjectAnswerPrompt = ({ question, contextText }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText,
    preferContext: false,
  });

const buildGenericSubjectGeminiPrompt = ({ question, contextText }) =>
  buildGeneralAcademicSolverPrompt({
    question,
    contextText,
    preferContext: false,
  });

const IMAGE_QUESTION_SOLVER_PROMPT =
  "You are an expert academic problem solver. Read the uploaded image carefully. The image may contain maths, physics, chemistry, accounts, commerce, table, graph, diagram, equation, or numerical problem. Answer the exact given question. Preserve all mathematical functions, scientific notation, accounting structures, tables, chemistry equations, diagrams, and subject-specific symbols. Do not rewrite the question into a different simpler equation. Solve according to the actual subject context. Generate accurate step-by-step answers and final answers. Use simple Grade 6 level words in explanations while keeping the same steps, calculations, reasoning, and final result. For simple school fill-in-the-blank questions, give the expected textbook-style answer directly without unnecessary steps. If the question asks to write a number in the International System, use commas, place-value formatting, or standard numeral grouping, only convert the number by inserting commas every 3 digits from right to left. Do not perform arithmetic, do not repeat the unformatted input, and return only the correctly formatted number with no label, formula, calculation, or explanation. For expanded form questions, remove zero-value place terms and do not write terms like 0 x 1,000, 0 x 10, + 0, or any other zero-place contribution. For Indian-number-system expanded forms, use Indian place-value grouping when helpful, such as 76,70,905 = 70,00,000 + 6,00,000 + 70,000 + 900 + 5. For place value questions, first identify the requested digit, then use the whole given number. Do not answer using only the last comma-separated group. Count Indian numbering places from right to left as Ones, Tens, Hundreds, Thousands, Ten Thousands, Lakhs, Ten Lakhs, Crores. For place value of 7 in 56,74,56,345, the final answer is 70,00,000. For face value questions, the final answer is the digit itself. Do not use Formula/Given/Substitution/Calculation format for place value or face value questions. For smallest/largest digit-number and place-value questions, keep the answer short and end with only the required value. Prefer common words such as Check instead of Determine, Find instead of Calculate, Much less instead of Significantly less, and Give a reason instead of Provide reasoning. For equation, numerical, formula-based, percentage, fraction, geometry, coordinate, or calculus solving, format every mathematical step as Step N:, then Explanation:, one short sentence explaining why the operation is used, then Operation:, then the original equation/formula/calculation. Keep each Explanation within 25 words. Explain any variable, notation, abbreviation, formula, or mathematical symbol the first time it appears. Put only mathematical work under Operation. Show only one mathematical transformation in each Operation. If the work needs several transformations, break them into smaller sequential Step/Explanation/Operation blocks. Each Operation must represent exactly one logical mathematical action. Do not combine multiple transformations or multiple equal-sign changes in one Operation. Do not skip intermediate mathematical operations. Do not use the dollar sign character anywhere in equations, expressions, explanations, formatted output, or final answers. Do not wrap math in dollar signs; write equations as plain readable text. Do not add long explanations, theory paragraphs, unrelated examples, or textbook-style notes. If the image is unclear, say what part is unclear instead of guessing.";

const extractGeminiText = (result) => {
  const text = typeof result?.text === "function" ? result.text() : result?.text;
  return formatGeminiStepPresentation(
    normalizeGeminiAnswer(
      text || result?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || ""
    )
  ).trim();
};

const runGeminiPrompt = async (prompt, models = GEMINI_SOLVER_MODELS) => {
  if (!ai) {
    console.error("Gemini solver error: ai is null. GEMINI_API_KEY may be missing or not loaded.");
    return "";
  }

  let lastError = null;
  for (const model of models) {
    try {
      console.log("GEMINI_SOLVER_MODEL_TRY", model);
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const text = extractGeminiText(result);
      console.log("GEMINI_SOLVER_MODEL_SUCCESS", model);
      return text;
    } catch (error) {
      lastError = error;
      console.error("GEMINI_SOLVER_MODEL_FAILED", model, error?.status || "", error?.message || error);
    }
  }

  console.error("GEMINI_SOLVER_ALL_MODELS_FAILED", lastError?.message || lastError);
  return "";
};

export const isAcademicSubjectRoute = ({ question, routingText }) => {
  const classifierQuestion = String(routingText || question || "").trim();
  const classifierLocalQuestion = normalizeQuestionForSolver(classifierQuestion);

  return (
    isEquationBasedQuestion(classifierQuestion) ||
    looksLikeTheorySubjectQuestion(classifierLocalQuestion) ||
    DIRECT_GEMINI_SUBJECT_PATTERN.test(classifierQuestion) ||
    SUBJECT_THEORY_HINT_PATTERN.test(classifierQuestion) ||
    GENERAL_ACADEMIC_SUBJECT_QUESTION_PATTERN.test(classifierQuestion)
  );
};

export async function solveWithGeminiFromTextbook({
  question,
  routingText,
  chunks = [],
  metadatas = [],
}) {
  console.log("GEMINI_SOLVER_ROUTE_HIT");
  console.log("GEMINI_SOLVER_TEXT_REQUEST");
  const solverQuestion = String(question || "").trim();
  const localQuestion = normalizeQuestionForSolver(question);
  const contextText = formatContextBlock({ chunks, metadatas }).trim() || "No relevant textbook context retrieved.";
  const localAnswer = solveQuestionLocally(localQuestion);
  const isAcademicSubjectQuestion = isAcademicSubjectRoute({ question: solverQuestion, routingText });

  if (!isAcademicSubjectQuestion) {
    return localAnswer || STEM_NO_ANSWER_TEXT;
  }

  if (!ai) {
    console.error("Gemini solver error: ai is null. Falling back without Gemini call.");
    return localAnswer || SOLVER_TEMPORARY_FAILURE_TEXT;
  }

  const promptAttempts = [];
  if (isStrictDerivationQuestion(solverQuestion)) {
    promptAttempts.push(buildStrictDerivationPrompt({ question: solverQuestion }));
  }
  if (hasMeaningfulTextbookContext({ chunks })) {
    promptAttempts.push(buildContextFirstBookPrompt({ question: solverQuestion, contextText }));
  }
  promptAttempts.push(buildExpertAcademicFallbackPrompt({ question: solverQuestion, contextText }));
  promptAttempts.push(buildGenericSubjectGeminiPrompt({ question: solverQuestion, contextText }));
  promptAttempts.push(buildDirectNumericalSolverPrompt({ question: solverQuestion }));
  promptAttempts.push(buildStrictUniversalSolverPrompt({ question: solverQuestion }));
  promptAttempts.push(buildForcedDirectSubjectSolverPrompt({ question: solverQuestion }));
  promptAttempts.push(buildDirectSubjectTheoryPrompt({ question: solverQuestion }));
  promptAttempts.push(buildFallbackSubjectAnswerPrompt({ question: solverQuestion, contextText }));
  promptAttempts.push(buildStemSolverPrompt({ question: solverQuestion, contextText }));

  console.log("Gemini solver question:", solverQuestion);

  for (const prompt of promptAttempts) {
    const answer = await runGeminiPrompt(prompt);
    const cleaned = String(answer || "").trim();
    console.log("Gemini solver cleaned answer:", cleaned);
    if (cleaned) {
      return cleaned;
    }
  }

  console.log("Gemini solver fallback triggered for question:", solverQuestion);
  return localAnswer || SOLVER_TEMPORARY_FAILURE_TEXT;
}

export async function solveImageQuestionWithGemini({ imageBase64, mimeType, question }) {
  console.log("GEMINI_SOLVER_ROUTE_HIT");
  console.log("GEMINI_SOLVER_IMAGE_REQUEST");

  if (!ai) {
    throw new Error("Gemini API key is not configured");
  }

  if (!imageBase64 || !mimeType) {
    throw new Error("Image data and MIME type are required");
  }

  const prompt = question
    ? `${IMAGE_QUESTION_SOLVER_PROMPT}\n\nUser instruction: ${String(question).trim()}`
    : IMAGE_QUESTION_SOLVER_PROMPT;

  const contents = [
    {
      role: "user",
      parts: [
        { text: prompt },
        createPartFromBase64(imageBase64, mimeType),
      ],
    },
  ];

  let lastError = null;
  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      console.log("GEMINI_SOLVER_MODEL_TRY", model);
      const result = await ai.models.generateContent({
        model,
        contents,
      });

      console.log("GEMINI_SOLVER_MODEL_SUCCESS", model);
      return extractGeminiText(result);
    } catch (err) {
      lastError = err;
      console.error("GEMINI_SOLVER_MODEL_FAILED", model, err?.status || "", err?.message || err);
    }
  }

  console.error("GEMINI_SOLVER_ALL_MODELS_FAILED", lastError?.message || lastError);
  throw lastError || new Error("Gemini image solver failed");
}
