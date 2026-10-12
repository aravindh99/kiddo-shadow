import { textbookKeywordRepository } from "./relatedQuestion.repository.js";

const QUESTION_COUNT = 4;
const MAX_KEYWORDS = 6;
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "define",
  "describe", "do", "does", "explain", "find", "for", "from", "how",
  "in", "is", "it", "of", "on", "or", "the", "this", "to", "what",
  "when", "where", "which", "who", "why", "with", "write",
]);

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) => normalizeText(value).split(" ").filter(Boolean);

export const extractKeywords = (question) =>
  [...new Set(
    tokenize(question).filter(
      (token) => token.length >= 3 && !STOP_WORDS.has(token) && !/^\d+$/.test(token)
    )
  )].slice(0, MAX_KEYWORDS);

const scoreRecords = (records, keywords) => {
  const searchableText = records.map((record) =>
    [
      record.text,
      record.metadata?.subject,
      record.metadata?.chapter,
      record.metadata?.book,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const tokenized = searchableText.map(tokenize);
  const keywordPhrase = keywords.join(" ");
  const averageLength =
    tokenized.reduce((sum, tokens) => sum + tokens.length, 0) /
      Math.max(tokenized.length, 1) || 1;
  const documentFrequency = new Map(
    keywords.map((keyword) => [
      keyword,
      tokenized.filter((tokens) => tokens.includes(keyword)).length,
    ])
  );

  return records
    .map((record, index) => {
      const tokens = tokenized[index];
      const frequencies = new Map();
      for (const token of tokens) {
        frequencies.set(token, (frequencies.get(token) || 0) + 1);
      }

      const matchedKeywords = keywords.filter((keyword) => frequencies.has(keyword));
      const bm25Score = keywords.reduce((total, keyword) => {
        const frequency = frequencies.get(keyword) || 0;
        if (!frequency) return total;
        const documentCount = records.length;
        const matchingDocuments = documentFrequency.get(keyword) || 0;
        const inverseFrequency = Math.log(
          1 + (documentCount - matchingDocuments + 0.5) / (matchingDocuments + 0.5)
        );
        const lengthFactor = 1.2 * (0.25 + 0.75 * (tokens.length / averageLength));
        return total + inverseFrequency * ((frequency * 2.2) / (frequency + lengthFactor));
      }, 0);
      const coverage = matchedKeywords.length / keywords.length;
      const phraseBoost = normalizeText(searchableText[index]).includes(keywordPhrase) ? 5 : 0;
      const score = bm25Score + coverage * coverage * 10 + phraseBoost;

      return { ...record, score, coverage, matchedKeywords };
    })
    .filter((record) => record.score > 0)
    .sort((a, b) => b.score - a.score);
};

const getScopeKey = (record) => {
  const metadata = record.metadata || {};
  return (
    metadata.source_path ||
    (metadata.book && metadata.chapter
      ? `${metadata.book}::${metadata.chapter}`
      : null) ||
    metadata.chapter ||
    metadata.book ||
    metadata.subject ||
    null
  );
};

const selectTopicRecords = (records) => {
  if (!records.length) return [];
  const groups = new Map();

  records.forEach((record, index) => {
    const scope = getScopeKey(record) || record.id || `record-${index}`;
    if (!groups.has(scope)) groups.set(scope, []);
    groups.get(scope).push(record);
  });

  const rankedGroups = [...groups.values()]
    .map((groupRecords) => {
      const sorted = [...groupRecords].sort((a, b) => b.score - a.score);
      const matchedKeywords = new Set(sorted.flatMap((record) => record.matchedKeywords));
      const maxCoverage = Math.max(...sorted.map((record) => record.coverage));
      const evidenceScore = sorted
        .slice(0, 5)
        .reduce((sum, record) => sum + record.score, 0);

      return {
        records: sorted,
        score: maxCoverage * 100 + matchedKeywords.size * 20 + evidenceScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  return rankedGroups[0].records.slice(0, 20);
};

const getGroundedKeywords = (records, keywords) => {
  const textbookTokens = new Set(
    records.flatMap((record) => [
      ...tokenize(record.text),
      ...tokenize(
        [
          record.metadata?.subject,
          record.metadata?.chapter,
          record.metadata?.book,
        ]
          .filter(Boolean)
          .join(" ")
      ),
    ])
  );

  return keywords.filter((keyword) => textbookTokens.has(keyword)).slice(0, 3);
};

const cleanQuestion = (value) => {
  const cleaned = String(value || "")
    .replace(/^\s*(?:q(?:uestion)?\s*)?\d+[.)\]:-]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 8 || cleaned.length > 180) return null;
  return cleaned.endsWith("?") ? cleaned : `${cleaned}?`;
};

const extractTextbookQuestions = (records, groundedKeywords) => {
  const candidates = [];
  for (const record of records.slice(0, 20)) {
    const matches = String(record.text).match(/[^.!?\n]{8,180}\?/g) || [];
    for (const match of matches) {
      const question = cleanQuestion(match);
      const questionTokens = new Set(tokenize(question));
      if (
        question &&
        groundedKeywords.some((keyword) => questionTokens.has(keyword))
      ) {
        candidates.push(question);
      }
    }
  }
  return candidates;
};

const buildGroundedQuestions = (groundedKeywords) => {
  const topic = groundedKeywords.join(" ");
  return [
    `What does the textbook explain about ${topic}?`,
    `How does the textbook describe ${topic}?`,
    `What are the key points about ${topic}?`,
    `Which facts in the textbook are related to ${topic}?`,
  ];
};

const uniqueQuestions = (questions, originalQuestion) => {
  const original = normalizeText(originalQuestion);
  const seen = new Set([original]);
  const result = [];

  for (const question of questions) {
    const normalized = normalizeText(question);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(question);
    if (result.length === QUESTION_COUNT) break;
  }

  return result;
};

export const createRelatedQuestionService = ({ repository }) =>
  Object.freeze({
    async generate(question) {
      const input = String(question || "").trim();
      if (!input) {
        const error = new Error("Question is required");
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
      }

      const keywords = extractKeywords(input);
      if (!keywords.length) {
        const error = new Error("No searchable keywords found in the question");
        error.statusCode = 422;
        error.isOperational = true;
        throw error;
      }

      const records = selectTopicRecords(
        scoreRecords(await repository.searchByKeywords(keywords), keywords)
      );
      if (!records.length) {
        const error = new Error("No related textbook content found");
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
      }

      const groundedKeywords = getGroundedKeywords(records, keywords);
      if (!groundedKeywords.length) {
        const error = new Error("No related textbook topic found");
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
      }

      const questions = uniqueQuestions(
        [
          ...extractTextbookQuestions(records, groundedKeywords),
          ...buildGroundedQuestions(groundedKeywords),
        ],
        input
      );

      if (questions.length !== QUESTION_COUNT) {
        const error = new Error("Unable to generate four related textbook questions");
        error.statusCode = 500;
        error.isOperational = true;
        throw error;
      }

      return questions;
    },
  });

export const relatedQuestionService = createRelatedQuestionService({
  repository: textbookKeywordRepository,
});
