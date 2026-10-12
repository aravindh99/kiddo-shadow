import { askRag, formatRagSources, retrieveRagContext } from "./rag.service.js";
import {
  solveWithGeminiFromTextbook,
  STEM_NO_ANSWER_TEXT,
  isEquationBasedQuestion,
  isEducationalFillInBlankQuestion,
} from "./geminiSolver.js";

const BOOK_NOT_PROVIDED_TEXT = "It is not provided in the book.";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^\p{L}\p{N}\s'/^*+=().,-]/gu, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const QUESTION_STOP_WORDS = new Set([
  "about",
  "what",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "whose",
  "why",
  "how",
  "tell",
  "explain",
  "describe",
  "write",
  "note",
  "brief",
  "short",
  "answer",
  "define",
  "the",
  "this",
  "that",
  "from",
  "with",
  "into",
  "there",
  "their",
  "they",
  "them",
  "your",
  "have",
  "book",
  "chapter",
  "topic",
]);

const detectSubjectCategory = ({ question, originalQuestion = null }) => {
  const routeQuestion = originalQuestion || question;

  // Educational fill-in-the-blank prompts ask for direct school answers and do not
  // benefit from retrieved chunks, so bypass RAG and use the existing Gemini solver.
  if (isEducationalFillInBlankQuestion(routeQuestion)) {
    return "equation";
  }

  return isEquationBasedQuestion(routeQuestion) ? "equation" : "text";
};

const extractQuestionKeywords = (question) =>
  [...new Set(
    normalizeText(question)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
      .filter((token) => !QUESTION_STOP_WORDS.has(token))
  )];

const uniqueNonEmpty = (values) => [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];

export const buildEquationRetrievalQueries = (question) => {
  const original = String(question || "").trim();
  const normalized = normalizeText(question);
  const queries = [original];

  if (!normalized) {
    return queries;
  }

  if (
    /\bx\b/.test(normalized) &&
    /\by\b/.test(normalized) &&
    (original.match(/=/g) || []).length >= 2
  ) {
    queries.push("pair of linear equations in two variables");
    queries.push("linear equations in two variables");
  }

  if (/\bwill\b.+\bcross\b|\bcross\b.+\beach other\b|\bintersect\b/i.test(original)) {
    queries.push("intersecting lines");
    queries.push("parallel lines and coincident lines");
    queries.push("condition for two lines to intersect");
  }

  if (/\bprincipal\s+value\b/i.test(original) || /\bsin\s*\^?\s*-?1\b|\bcos\s*\^?\s*-?1\b|\btan\s*\^?\s*-?1\b/i.test(original)) {
    queries.push("inverse trigonometric functions principal value");
    queries.push("principal value of inverse trigonometric functions");
  }

  if (/\bquadratic\b|\bdiscriminant\b|\broots?\b/i.test(original)) {
    queries.push("quadratic equations discriminant roots");
  }

  if (/\bprobability\b|\bmean\b|\bmedian\b|\bmode\b|\bvariance\b|\bstandard deviation\b/i.test(original)) {
    queries.push("statistics and probability");
  }

  if (/\barea\b|\bperimeter\b|\bvolume\b|\bsurface area\b/i.test(original)) {
    queries.push("mensuration formulas");
  }

  const keywords = extractQuestionKeywords(question).slice(0, 8).join(" ");
  if (keywords) {
    queries.push(keywords);
  }

  return uniqueNonEmpty(queries);
};

const scoreRetrievedContext = ({ question, context }) => {
  const chunks = Array.isArray(context?.chunks) ? context.chunks : [];
  const metadatas = Array.isArray(context?.metadatas) ? context.metadatas : [];
  if (!chunks.length) return -1;

  const searchableText = [
    ...chunks,
    ...metadatas.map((meta) =>
      [meta?.subject, meta?.chapter, meta?.book, meta?.source_path].filter(Boolean).join(" ")
    ),
  ]
    .join(" ")
    .toLowerCase();

  const keywords = extractQuestionKeywords(question);
  const matches = keywords.filter((keyword) => searchableText.includes(keyword)).length;
  return matches * 10 + Math.min(chunks.length, 10);
};

const retrieveEquationContext = async ({ question, classLevel, bookScope }) => {
  const queries = buildEquationRetrievalQueries(question);
  let bestContext = null;
  let bestScore = -1;

  for (const query of queries) {
    const context = await retrieveRagContext({
      query,
      classLevel,
      bookScope,
      allowGlobal: !bookScope,
    });

    const score = scoreRetrievedContext({ question, context });
    if (score > bestScore) {
      bestScore = score;
      bestContext = context;
    }

    if (score >= 20) {
      break;
    }
  }

  return bestContext || {
    chunks: [],
    metadatas: [],
    filter: "stem_router_no_match",
  };
};

const hasBookSupportForQuestion = ({ question, context }) => {
  const chunks = Array.isArray(context?.chunks) ? context.chunks : [];
  const metadatas = Array.isArray(context?.metadatas) ? context.metadatas : [];

  if (!chunks.length) {
    return false;
  }

  const searchableText = [
    ...chunks,
    ...metadatas.map((meta) =>
      [meta?.subject, meta?.chapter, meta?.book, meta?.source_path].filter(Boolean).join(" ")
    ),
  ]
    .join(" ")
    .toLowerCase();

  const keywords = extractQuestionKeywords(question);
  if (!keywords.length) {
    return true;
  }

  return keywords.some((keyword) => searchableText.includes(keyword));
};

const buildStemResponse = ({ answer, metadatas = [], filter = "stem_router" }) => ({
  answer,
  sources: formatRagSources(metadatas),
  source_type: metadatas.length ? "rag" : "rag_no_match",
  filters_used: filter,
});

export async function routeRagQuestion({
  question,
  originalQuestion = null,
  preferPreciseAnswer = false,
  previousAnswer = null,
  classLevel,
  bookScope = null,
  userId,
}) {
  console.log("ROUTE_RAG_QUESTION_ENTRY", {
    question,
    originalQuestion,
    preferPreciseAnswer,
    hasPreviousAnswer: Boolean(previousAnswer),
    classLevel,
    bookScope,
    userId,
  });

  const equationQuestion = String(originalQuestion || question || "").trim();
  const subjectCategory = detectSubjectCategory({
    question,
    originalQuestion: equationQuestion,
    bookScope,
  });

  if (subjectCategory !== "equation") {
    const result = await askRag({
      question,
      originalQuestion,
      preferPreciseAnswer,
      previousAnswer,
      classLevel,
      bookScope,
      userId,
    });

    if (String(result?.answer || "").trim() === "I don't know based on the provided books.") {
      return {
        ...result,
        answer: BOOK_NOT_PROVIDED_TEXT,
      };
    }

    const isDirectBookAnswer =
      String(result?.filters_used || "") === "exact_topic_pdf_section" ||
      /^pdf_text_(fallback|only)$/.test(String(result?.filters_used || ""));

    if (!isDirectBookAnswer) {
      const validationContext = await retrieveRagContext({
        query: question,
        classLevel,
        bookScope,
        allowGlobal: !bookScope,
      });

      if (!hasBookSupportForQuestion({ question, context: validationContext })) {
        return {
          ...result,
          answer: BOOK_NOT_PROVIDED_TEXT,
          sources: [],
          source_type: "rag_no_match",
          filters_used: `${result?.filters_used || "rag"}_book_guard_no_match`,
        };
      }
    }

    return result;
  }

  const context = await retrieveEquationContext({
    question: equationQuestion,
    classLevel,
    bookScope,
  });

  const answer = await solveWithGeminiFromTextbook({
    question: equationQuestion,
    chunks: context?.chunks || [],
    metadatas: context.metadatas || [],
  });

  return buildStemResponse({
    answer: answer || BOOK_NOT_PROVIDED_TEXT,
    metadatas: context.metadatas || [],
    filter: `${context.filter || "stem_router"}_gemini_solver`,
  });
}
