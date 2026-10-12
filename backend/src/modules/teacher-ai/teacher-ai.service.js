import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import AppError from "../../shared/appError.js";
import { PROMPTS } from "./teacher-ai.prompts.js";
import { retrieveRagContext, formatRagSources } from "../rag/rag.service.js";

const MAX_TEACHER_CONTEXT_CHARS = 6000;
const SENTENCE_MIN = 35;
const SENTENCE_MAX = 240;
const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const BOOKS_DIR = path.resolve(process.cwd(), "books");
const RAG_DATA_DIR = path.resolve(process.cwd(), "rag_data");
const CHROMA_DATA_DIR = path.resolve(process.cwd(), "rag_data/chroma");

function isStemSubject(subject = "") {
  const normalized = String(subject).trim().toLowerCase();
  return ["math", "maths", "mathematics", "physics", "chemistry"].includes(normalized);
}

function trimTeacherContext(chunks = []) {
  const picked = [];
  let used = 0;

  for (const rawChunk of chunks) {
    const chunk = String(rawChunk || "").trim();
    if (!chunk) continue;

    const remaining = MAX_TEACHER_CONTEXT_CHARS - used;
    if (remaining <= 0) break;

    const next = chunk.slice(0, remaining);
    picked.push(next);
    used += next.length;
  }

  return picked;
}

function normalizeWhitespace(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,.;:!?])/g, "$1")
    .trim();
}

function isQuotaError(err) {
  const status = Number(err?.status || err?.code || err?.error?.code || 0);
  const msg = String(err?.message || "").toLowerCase();
  return (
    status === 429 ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate limit")
  );
}

function extractGeneratedText(result) {
  return (
    result?.text ||
    result?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") ||
    ""
  );
}

function sanitizeGeneratedText(text = "") {
  return String(text || "")
    .replace(/^```(?:markdown|md|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function parseImageDataUrl(rawDataUrl, name = null) {
  const value = String(rawDataUrl || "").trim();
  if (!value) return null;

  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new AppError("image_data must be a valid base64 data URL", 400);
  }

  const mimeType = match[1];
  const data = match[2];
  const bytes = Math.floor((data.length * 3) / 4);

  if (bytes > MAX_IMAGE_BYTES) {
    throw new AppError("Captured image is too large", 400);
  }

  return {
    mimeType,
    data,
    bytes,
    name: String(name || "").trim() || null,
  };
}

function parseImagePayloads(payload = {}) {
  const pages = []
    .concat(payload?.image_pages || payload?.imagePages || [])
    .concat(payload?.photo_pages || payload?.photoPages || [])
    .filter(Boolean);

  if (pages.length) {
    return pages.map((page, index) => {
      if (typeof page === "string") {
        return parseImageDataUrl(page, `Captured page ${index + 1}`);
      }

      return parseImageDataUrl(
        page?.data || page?.image_data || page?.imageData || page?.photo_data || page?.photoData,
        page?.name || page?.image_name || page?.imageName || `Captured page ${index + 1}`
      );
    });
  }

  const legacyImage = parseImageDataUrl(
    payload?.image_data || payload?.imageData || payload?.photo_data || payload?.photoData,
    payload?.image_name || payload?.imageName || payload?.photo_name || payload?.photoName
  );

  return legacyImage ? [legacyImage] : [];
}

function toWholeNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.floor(num);
}

const QUESTION_TYPE_DEFINITIONS = {
  choose: { label: "Choose the correct answer" },
  text: { label: "Text Answer" },
  custom: { label: "Custom Pattern" },
  fill: { label: "Fill in the blanks" },
  match: { label: "Match the following" },
  true_false: { label: "True or False" },
  synonyms: { label: "Synonyms" },
  antonyms: { label: "Antonyms" },
  grammar: { label: "Grammar" },
  paragraph: { label: "Paragraph Writing" },
  short_answer: { label: "Short Answer" },
  long_answer: { label: "Long Answer" },
};

function normalizeQuestionType(value = "choose") {
  const raw = String(value || "choose").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["fillup", "fill_up", "fill_blank", "fill_blanks", "fill_in_the_blank", "fill_in_the_blanks"].includes(raw)) return "fill";
  if (["truefalse", "true_or_false", "true_false", "true/false"].includes(raw)) return "true_false";
  if (["text", "written", "written_answer", "text_answer"].includes(raw)) return "text";
  if (["custom", "own_pattern", "custom_pattern"].includes(raw)) return "custom";
  if (["matching", "match_the_following"].includes(raw)) return "match";
  if (["synonym", "synonyms"].includes(raw)) return "synonyms";
  if (["antonym", "antonyms"].includes(raw)) return "antonyms";
  if (["paragraph", "paragraph_writing", "paragraph_question"].includes(raw)) return "paragraph";
  if (["grammar", "grammer", "language_grammar"].includes(raw)) return "grammar";
  if (["short", "shortanswer", "short_answer"].includes(raw)) return "short_answer";
  if (["long", "essay", "longanswer", "long_answer"].includes(raw)) return "long_answer";
  return QUESTION_TYPE_DEFINITIONS[raw] ? raw : "choose";
}

function getPatternLabel(type = "choose") {
  return QUESTION_TYPE_DEFINITIONS[type]?.label || QUESTION_TYPE_DEFINITIONS.choose.label;
}

function buildSectionTitle(index, marks) {
  return `Section ${String.fromCharCode(65 + index)}: ${marks} Mark Questions`;
}

function resolveQuestionPattern(payload = {}) {
  const pattern = payload?.question_pattern || payload?.questionPattern || {};
  const customPatterns = []
    .concat(pattern?.patterns || pattern?.patterns_list || pattern?.rows || payload?.patterns || [])
    .filter(Boolean);

  let normalizedPatterns = [];

  if (customPatterns.length) {
    const merged = new Map();
    customPatterns.forEach((item) => {
      const type = normalizeQuestionType(item?.type ?? item?.pattern ?? item?.question_type ?? item?.questionType);
      const marks = Math.min(8, Math.max(1, toWholeNumber(item?.marks ?? item?.mark ?? item?.marksPerQuestion, 1)));
      const count = toWholeNumber(item?.count ?? item?.question_count ?? item?.questionCount, 0);
      const customLabel = String(item?.custom_label ?? item?.customLabel ?? item?.title ?? "").trim();
      if (!count) return;
      const resolvedTitle = type === "custom" && customLabel ? customLabel : (String(item?.title || "").trim() || getPatternLabel(type));
      const key = `${type}_${marks}_${resolvedTitle.toLowerCase()}`;
      const current = merged.get(key) || {
        key,
        type,
        title: resolvedTitle,
        customLabel: type === "custom" ? customLabel : "",
        marksPerQuestion: marks,
        count: 0,
      };
      current.count += count;
      merged.set(key, current);
    });
    normalizedPatterns = Array.from(merged.values());
  }

  if (!normalizedPatterns.length) {
    const explicitOneMarkCount = pattern?.one_mark_count ?? pattern?.oneMarkCount ?? payload?.one_mark_count ?? payload?.oneMarkCount;
    const selectedOneMarkType = normalizeQuestionType(
      pattern?.one_mark_type ?? pattern?.oneMarkType ?? payload?.one_mark_type ?? payload?.oneMarkType
    );
    const selectedOneMarkCount = toWholeNumber(explicitOneMarkCount, 5);
    const legacyPatterns = [
      {
        type: "choose",
        marksPerQuestion: 1,
        count: toWholeNumber(
          pattern?.one_mark_choose_count ?? pattern?.oneMarkChooseCount ?? payload?.one_mark_choose_count ?? payload?.oneMarkChooseCount,
          explicitOneMarkCount === undefined ? 0 : selectedOneMarkType === "choose" ? selectedOneMarkCount : 0
        ),
      },
      {
        type: "fill",
        marksPerQuestion: 1,
        count: toWholeNumber(
          pattern?.one_mark_fill_count ?? pattern?.oneMarkFillCount ?? payload?.one_mark_fill_count ?? payload?.oneMarkFillCount,
          explicitOneMarkCount === undefined ? 0 : selectedOneMarkType === "fill" ? selectedOneMarkCount : 0
        ),
      },
      {
        type: "match",
        marksPerQuestion: 1,
        count: toWholeNumber(
          pattern?.one_mark_match_count ?? pattern?.oneMarkMatchCount ?? payload?.one_mark_match_count ?? payload?.oneMarkMatchCount,
          explicitOneMarkCount === undefined ? 0 : selectedOneMarkType === "match" ? selectedOneMarkCount : 0
        ),
      },
      {
        type: "true_false",
        marksPerQuestion: 1,
        count: toWholeNumber(
          pattern?.one_mark_true_false_count ?? pattern?.oneMarkTrueFalseCount ?? payload?.one_mark_true_false_count ?? payload?.oneMarkTrueFalseCount,
          explicitOneMarkCount === undefined ? 0 : selectedOneMarkType === "true_false" ? selectedOneMarkCount : 0
        ),
      },
      {
        type: "short_answer",
        marksPerQuestion: 2,
        count: toWholeNumber(pattern?.two_mark_count ?? pattern?.twoMarkCount ?? payload?.two_mark_count ?? payload?.twoMarkCount, 4),
      },
      {
        type: "short_answer",
        marksPerQuestion: 3,
        count: toWholeNumber(pattern?.three_mark_count ?? pattern?.threeMarkCount ?? payload?.three_mark_count ?? payload?.threeMarkCount, 2),
      },
      {
        type: "paragraph",
        marksPerQuestion: 5,
        count: toWholeNumber(pattern?.five_mark_count ?? pattern?.fiveMarkCount ?? payload?.five_mark_count ?? payload?.fiveMarkCount, 1),
      },
    ].filter((item) => item.count > 0);

    normalizedPatterns = legacyPatterns.map((item) => ({
      key: `${item.type}_${item.marksPerQuestion}`,
      type: item.type,
      title: getPatternLabel(item.type),
      marksPerQuestion: item.marksPerQuestion,
      count: item.count,
    }));
  }

  normalizedPatterns.sort((left, right) => left.marksPerQuestion - right.marksPerQuestion || left.title.localeCompare(right.title));

  const groupedMarks = [...new Set(normalizedPatterns.map((item) => item.marksPerQuestion))];
  const sections = groupedMarks.map((marks, index) => {
    const patternsForMarks = normalizedPatterns.filter((item) => item.marksPerQuestion === marks);
    return {
      key: `section_${marks}`,
      title: buildSectionTitle(index, marks),
      count: patternsForMarks.reduce((sum, item) => sum + item.count, 0),
      marksPerQuestion: marks,
      patterns: patternsForMarks,
    };
  });

  return {
    patterns: normalizedPatterns,
    sections,
    totalQuestions: sections.reduce((sum, section) => sum + section.count, 0),
    totalMarks: sections.reduce((sum, section) => sum + section.count * section.marksPerQuestion, 0),
    summary: normalizedPatterns
      .map((item) => `${item.count} x ${item.marksPerQuestion} mark${item.marksPerQuestion > 1 ? "s" : ""} (${item.title})`)
      .join(", "),
  };
}

function splitIntoSentences(chunks = []) {
  const raw = chunks.join(" ");
  return raw
    .replace(/\r?\n+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length >= SENTENCE_MIN && line.length <= SENTENCE_MAX)
    .filter((line) => /[a-zA-Z]/.test(line))
    .filter((line) => !/^\d+[.)]?\s*$/.test(line))
    .filter((line) => !/^(figure|table|exercise|activity|example)\b/i.test(line));
}

function uniqueSentences(sentences = []) {
  const seen = new Set();
  const items = [];

  for (const sentence of sentences) {
    const key = sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(sentence);
  }

  return items;
}

function extractTopicFromSentence(sentence = "") {
  const normalized = normalizeWhitespace(sentence).replace(/[.?!]+$/, "");
  const definitionalPatterns = [
    /^(.{3,60}?)\s+(?:is|are|was|were|means|refers to|is called|are called|can be defined as)\b/i,
    /^(.{3,60}?)\s+(?:includes|consists of|contains|describes|explains|focuses on)\b/i,
  ];

  for (const pattern of definitionalPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/^(the|a|an)\s+/i, "").trim();
    }
  }

  const words = normalized.split(" ");
  return words.slice(0, Math.min(6, words.length)).join(" ");
}

function createBlankedSentence(sentence = "") {
  const topic = extractTopicFromSentence(sentence);
  if (!topic || topic.length < 3) return sentence;
  const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blanked = sentence.replace(new RegExp(`\\b${escaped}\\b`, "i"), "_____");
  return (blanked === sentence ? sentence.replace(/\b([A-Za-z]{4,})\b/, "_____") : blanked).replace(/\s+/g, " ");
}

function isWeakQuestionTopic(topic = "") {
  return /^(students?|teachers?|use|write|answer|revise|include|focus|ask)\b/i.test(String(topic || "").trim());
}

function collectTextbookPoints(chunks = []) {
  return uniqueSentences(splitIntoSentences(chunks)).slice(0, 18);
}

function getPointAt(points = [], index = 0, fallback = "the given chapter") {
  if (!points.length) return fallback;
  return points[index % points.length];
}

function extractKeywordFromSentence(sentence = "", fallback = "the key term") {
  const words = String(sentence || "")
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 5)
    .filter((word) => !["which", "their", "there", "about", "these", "those", "chapter", "subject"].includes(word.toLowerCase()));

  return words[0] || extractTopicFromSentence(sentence) || fallback;
}

function markLabel(marks) {
  return `${marks} mark${marks > 1 ? "s" : ""}`;
}

function createQuestionByPattern({ patternItem, sentence, topic, subject, chapter, questionNumber, localIndex, stemSubject }) {
  const marksText = markLabel(patternItem.marksPerQuestion);
  const cleanedSentence = sentence.replace(/[.!?]+$/g, "");
  const keyword = extractKeywordFromSentence(sentence, topic);

  switch (patternItem.type) {
    case "choose":
      return `${questionNumber}. Choose the correct answer: ${topic} is mainly related to which part of ${subject}? (a) ${topic} (b) Unrelated term (c) Opposite idea (d) None of these (${marksText})`;
    case "fill":
      return `${questionNumber}. Fill in the blank from the textbook statement: ${createBlankedSentence(sentence)} (${marksText})`;
    case "text":
      return patternItem.marksPerQuestion <= 2
        ? `${questionNumber}. Write a short text answer about ${topic} based on the lesson content. (${marksText})`
        : `${questionNumber}. Write a text answer on ${topic} using textbook points, explanation, and suitable examples. (${marksText})`;
    case "custom":
      return patternItem.marksPerQuestion <= 2
        ? `${questionNumber}. ${patternItem.title}: write a short answer about ${topic} from the lesson content. (${marksText})`
        : `${questionNumber}. ${patternItem.title}: write a detailed answer on ${topic} using textbook points, explanation, and suitable examples. (${marksText})`;
    case "match":
      return `${questionNumber}. Match the following related to ${topic}: Column A item ${localIndex + 1} with its correct meaning, example, or textbook use. (${marksText})`;
    case "true_false":
      return `${questionNumber}. True or False: ${cleanedSentence}. (${marksText})`;
    case "synonyms":
      return `${questionNumber}. Write a synonym or closest textbook meaning for "${keyword}" in the context of ${chapter}. (${marksText})`;
    case "antonyms":
      return `${questionNumber}. Write an antonym or opposite meaning for "${keyword}" suitable to the lesson context of ${chapter}. (${marksText})`;
    case "grammar":
      return patternItem.marksPerQuestion <= 2
        ? `${questionNumber}. Correct the grammar, tense, or punctuation in this sentence: "${cleanedSentence}." (${marksText})`
        : `${questionNumber}. Rewrite the following sentence in grammatically correct form without changing the lesson meaning: "${cleanedSentence}." (${marksText})`;
    case "paragraph":
      return `${questionNumber}. Write a clear paragraph on ${topic} using textbook points, keywords, and one suitable example. (${marksText})`;
    case "long_answer":
      return stemSubject
        ? `${questionNumber}. Write a detailed answer on ${topic} with explanation, formula or steps where needed, and a labelled diagram or worked example wherever relevant. (${marksText})`
        : `${questionNumber}. Write a detailed long answer on ${topic} with definition, explanation, examples, and a proper conclusion. (${marksText})`;
    case "short_answer":
      if (patternItem.marksPerQuestion <= 2) {
        return `${questionNumber}. Explain ${topic} briefly in 2-3 lines using the textbook idea: "${sentence}" (${marksText})`;
      }
      return `${questionNumber}. Write a short answer on ${topic} using ${Math.max(3, patternItem.marksPerQuestion)} textbook points and one suitable example. (${marksText})`;
    default:
      return patternItem.marksPerQuestion >= 5
        ? `${questionNumber}. Write a structured answer on ${topic} using textbook explanation, examples, and important points. (${marksText})`
        : `${questionNumber}. Write a short answer on ${topic} based on the chapter content. (${marksText})`;
  }
}

function buildQuestionSections({ payload, points = [] }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const chapter = payload?.chapter || payload?.topic || "Topic";
  const pattern = resolveQuestionPattern(payload);
  const stemSubject = isStemSubject(subject);
  let questionNumber = 1;

  const sectionBlocks = pattern.sections
    .filter((section) => section.count > 0)
    .map((section) => {
      const patternBlocks = (section.patterns || []).map((patternItem) => {
        const questions = [];
        for (let index = 0; index < patternItem.count; index += 1) {
          const sentence = getPointAt(points, questionNumber - 1, `${chapter} is an important concept in ${subject}.`);
          const extractedTopic = extractTopicFromSentence(sentence);
          const topic = extractedTopic && !isWeakQuestionTopic(extractedTopic) ? extractedTopic : chapter;
          questions.push(
            createQuestionByPattern({
              patternItem,
              sentence,
              topic,
              subject,
              chapter,
              questionNumber,
              localIndex: index,
              stemSubject,
            })
          );
          questionNumber += 1;
        }

        return questions.length ? `${patternItem.title}\n${questions.join("\n")}` : "";
      }).filter(Boolean);

      return `${section.title}\n${patternBlocks.join("\n\n")}`;
    });

  return {
    pattern,
    text: sectionBlocks.join("\n\n"),
    teacherReferencePoints: points.slice(0, 8).map((line, index) => `${index + 1}. ${line}`).join("\n"),
    classLevel,
    subject,
    chapter,
  };
}

function buildQuestionPaperFromTextbook({ payload, chunks }) {
  const points = collectTextbookPoints(chunks);

  if (!points.length) {
    return buildQuestionPaperFallback({ payload, chunks });
  }
  const { pattern, text, teacherReferencePoints, classLevel, subject, chapter } = buildQuestionSections({
    payload,
    points,
  });

  return `**CBSE Textbook-Based Question Paper**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Chapter:** ${chapter}
**Total Marks:** ${pattern.totalMarks}
**Question Pattern:** ${pattern.summary}

**General Instructions:**
- All questions are compulsory.
- Answer only from the prescribed textbook content.
- Use textbook terms, examples, and chapter explanations wherever relevant.
- Follow the section-wise marks pattern exactly.

${text}

**Teacher Reference Points**
${teacherReferencePoints}`;
}

function buildLessonSummaryFromTextbook({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const topic = payload?.topic || payload?.chapter || "Topic";
  const points = collectTextbookPoints(chunks);

  if (!points.length) {
    return buildLessonSummaryFallback({ payload, chunks });
  }

  const opening = points.slice(0, 2).map((line) => `- ${line}`).join("\n");
  const conceptPoints = points.slice(2, 6).map((line) => `- ${line}`).join("\n");
  const recapPoints = points.slice(6, 8).map((line) => `- ${line}`).join("\n") || `- Revise the key ideas from the textbook section on ${topic}.`;
  const stemNotes = isStemSubject(subject)
    ? `
**STEM Classroom Notes**
- Highlight every formula, unit, or equation exactly as shown in the textbook.
- Ask students to practise any labelled diagram, graph, or structure mentioned in the chapter.
`
    : "";

  return `**Textbook-Based Lesson Summary**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Topic:** ${topic}

**Lesson Opening**
${opening}

**Core Concepts From Textbook**
${conceptPoints}
${stemNotes}
**Recap And Reinforcement**
${recapPoints}`;
}

function collectFallbackPoints(chunks = []) {
  return chunks
    .flatMap((chunk) =>
      String(chunk || "")
        .split(/(?<=[.?!])\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 30)
    )
    .slice(0, 8);
}

function buildQuestionPaperFallback({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const chapter = payload?.chapter || payload?.topic || "Topic";
  const points = collectFallbackPoints(chunks);
  const referenceLines =
    points.length > 0
      ? points.map((line, index) => `${index + 1}. ${line}`).join("\n")
      : [
          `1. Focus on the main idea, definition, and examples from ${chapter}.`,
          `2. Ask students to write short and long answers in clear textbook language.`,
          `3. Include one application-style question connected to ${subject}.`,
        ].join("\n");
  const seedPoints = points.length
    ? points
    : [
        `${chapter} is an important topic in ${subject}.`,
        `Students should revise the main definition, key points, and examples from ${chapter}.`,
        `Use clear textbook language while answering questions from ${chapter}.`,
      ];
  const { pattern, text } = buildQuestionSections({
    payload,
    points: seedPoints,
  });

  return `**CBSE Textbook-Based Question Paper**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Chapter:** ${chapter}
**Total Marks:** ${pattern.totalMarks}
**Question Pattern:** ${pattern.summary}

**General Instructions:**
- All questions are compulsory.
- Answer in clear and simple classroom language.
- Use chapter keywords wherever possible.
- Follow the section-wise marks pattern exactly.

${text}

**Teacher Reference Points**
${referenceLines}`;
}

function buildLessonSummaryFallback({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const topic = payload?.topic || payload?.chapter || "Topic";
  const points = collectFallbackPoints(chunks);
  const bulletLines =
    points.length > 0
      ? points.map((line) => `- ${line}`).join("\n")
      : `- Textbook context for ${topic} was too limited for a structured summary.`;

  return `**Textbook-Based Lesson Summary**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Topic:** ${topic}

**Available Textbook Points**
${bulletLines}`;
}

function detectTeacherAiFallbackReason(context) {
  const filter = context?.filter || null;
  const booksExists = fs.existsSync(BOOKS_DIR);
  const ragDataExists = fs.existsSync(RAG_DATA_DIR);
  const chromaDataExists = fs.existsSync(CHROMA_DATA_DIR);

  if (!booksExists) {
    return {
      code: "books_missing",
      lines: [
        `- Missing books folder: ${BOOKS_DIR}`,
        "- Add textbook PDFs under the books directory before running ingestion.",
      ],
    };
  }

  if (!ragDataExists || !chromaDataExists) {
    return {
      code: "rag_index_missing",
      lines: [
        `- Missing RAG index: ${CHROMA_DATA_DIR}`,
        "- Run textbook ingestion to create the Chroma collection.",
      ],
    };
  }

  if (filter === "chroma_unavailable" || filter === "rag_error") {
    return {
      code: "chroma_unavailable",
      lines: [
        "- Chroma database is not reachable from the backend.",
        "- Start Chroma with the configured CHROMA_URL before generating AI content.",
      ],
    };
  }

  return {
    code: "no_matching_chunks",
    lines: [
      "- No matching chapter chunks were retrieved for this topic.",
      "- Re-ingest the correct textbook PDF and verify the chapter title matches the topic you typed.",
    ],
  };
}

function appendFallbackReason(text, context) {
  const reason = detectTeacherAiFallbackReason(context);
  return `${text}\n\n**RAG Status**\n${reason.lines.join("\n")}`;
}

function buildTeacherAiFromTextbook({ aiType, payload, chunks }) {
  if (aiType === "question_paper") {
    return buildQuestionPaperFromTextbook({ payload, chunks });
  }
  if (aiType === "lesson_summary") {
    return buildLessonSummaryFromTextbook({ payload, chunks });
  }
  return "Unable to generate textbook-based content for this task.";
}

function formatContextBlock({ chunks = [], metadatas = [] }) {
  return chunks
    .map((chunk, index) => {
      const metadata = metadatas[index] || {};
      const sourcePath = metadata.source_path || metadata.book || metadata.chapter || "unknown";
      const pageNumber = metadata.page_number ? ` page ${metadata.page_number}` : "";
      return `[Source: ${sourcePath}${pageNumber}]\n${String(chunk || "").trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildPatternInstructionBlock(pattern) {
  return pattern.sections
    .map((section) => {
      const lines = [`- Add section exactly as: ${section.title}`];
      (section.patterns || []).forEach((patternItem) => {
        lines.push(`  - ${patternItem.title}: ${patternItem.count} question(s) x ${patternItem.marksPerQuestion} mark(s)`);
      });
      return lines.join("\n");
    })
    .join("\n");
}

function buildTeacherAiGeminiPrompt({ aiType, payload, promptText, chunks, metadatas }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const topic = payload?.topic || payload?.chapter || "Captured worksheet";
  const pattern = resolveQuestionPattern(payload);
  const marks = Number(payload?.marks || payload?.totalMarks || pattern.totalMarks || 20);
  const contextText = formatContextBlock({ chunks, metadatas }) || "No textbook context retrieved.";
  const imageCount = parseImagePayloads(payload).length;
  const hasImage = imageCount > 0;

  if (aiType === "question_paper") {
    return `
You are generating a CBSE-style question paper for a teacher.

Teacher request:
${promptText}

Use ONLY the textbook context below as the academic source of truth.
Do not turn the answer into a lesson summary.
Create a real question paper with exam questions, not reference notes.

Class: ${classLevel}
Subject: ${subject}
Chapter/Topic: ${topic}
Total Marks: ${marks}

${hasImage ? `Use the attached captured pages as additional primary sources. There are ${imageCount} images. Read all textbook pages / notebook pages / question pages carefully and merge their content into one paper.\n` : ""}

Output rules:
- Return plain text only.
- Start with the title "CBSE Textbook-Based Question Paper".
- Include Class, Subject, Chapter, and Total Marks lines.
- Include a "Question Pattern" line matching this exact split: ${pattern.summary}.
- Add "General Instructions".
- Follow this exact section and pattern split:
${buildPatternInstructionBlock(pattern)}
- The final paper must total exactly ${pattern.totalMarks} marks.
- Every question line must begin with a number like "1. ".
- Include marks on every question line.
- Keep the paper classroom-ready and distinct from a summary.
- Do not include source citations, explanations to the teacher, or markdown code fences.

Textbook context:
${contextText}
`;
  }

  return `
You are generating a teacher-facing lesson summary from textbook material.

Teacher request:
${promptText}

Use ONLY the textbook context below as the academic source of truth.
Do not turn the answer into a question paper.

Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}

${hasImage ? "Use the attached image as an additional primary source. Read the captured page/notes from the image when building the lesson summary.\n" : ""}

Output rules:
- Return plain text only.
- Start with the title "Textbook-Based Lesson Summary".
- Include Class, Subject, and Topic lines.
- Add short sections named:
Lesson Opening
Core Concepts From Textbook
Teaching Flow
Recap And Reinforcement
- Use bullet points under the sections.
- Do not number lines like exam questions.
- Make it easy for a teacher to explain in one class period.
- Do not include source citations, teacher notes outside the summary, or markdown code fences.

Textbook context:
${contextText}
`;
}

async function generateTeacherAiWithGemini({ aiType, payload, promptText, chunks, metadatas, imageInput }) {
  if (!ai || (!chunks.length && !imageInput?.length)) return null;

  const prompt = buildTeacherAiGeminiPrompt({
    aiType,
    payload,
    promptText,
    chunks,
    metadatas,
  });

  try {
      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: imageInput?.length
          ? [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  ...imageInput.map((image) => ({
                    inlineData: {
                      mimeType: image.mimeType,
                      data: image.data,
                    },
                  })),
                ],
              },
            ]
        : prompt,
    });

    const text = sanitizeGeneratedText(extractGeneratedText(result));
    return text || null;
  } catch (err) {
    if (isQuotaError(err)) return null;
    return null;
  }
}

export async function runTeacherAI({ user, aiType, payload }) {
  if (user.role !== "teacher") {
    throw new AppError("Only teachers can use this AI feature", 403);
  }

  const promptBuilder = PROMPTS[aiType];
  if (!promptBuilder) {
    throw new AppError("Invalid teacher AI task", 400);
  }

  const imageInput = parseImagePayloads(payload || {});
  const safePayload = {
    subject: "General",
    ...payload,
  };
  if (!safePayload.topic && !safePayload.chapter && imageInput.length) {
    safePayload.topic = imageInput[0].name || "Captured worksheet";
    safePayload.chapter = safePayload.topic;
  }
  const questionPattern = resolveQuestionPattern(safePayload);
  safePayload.marks = Number(safePayload.marks || safePayload.totalMarks || questionPattern.totalMarks || 20);
  safePayload.totalMarks = safePayload.marks;
  safePayload.question_pattern = {
    patterns: questionPattern.patterns.map((item) => ({
      type: item.type,
      marks: item.marksPerQuestion,
      count: item.count,
      title: item.title,
      custom_label: item.customLabel || "",
    })),
  };
  const promptText = promptBuilder(safePayload);

  const ragQuery = safePayload?.topic || safePayload?.chapter;
  const hasScope = safePayload?.classLevel;
  const requireRag = new Set(["lesson_summary", "question_paper"]);

  if (!ragQuery || !hasScope) {
    if (requireRag.has(aiType)) {
      return {
      text: buildTeacherAiFromTextbook({ aiType, payload: safePayload, chunks: [] }),
        source_type: "fallback",
        sources: [],
        filters_used: null,
        image_used: imageInput.length > 0,
        image_count: imageInput.length,
      };
    }
  }

  let context;
  try {
    context = await retrieveRagContext({
      query: ragQuery,
      classLevel: safePayload.classLevel,
      allowGlobal: true,
    });
  } catch {
    context = {
      chunks: [],
      metadatas: [],
      distances: [],
      filter: "rag_error",
    };
  }

  const trimmedChunks = trimTeacherContext(context.chunks || []);
  const text =
    (await generateTeacherAiWithGemini({
      aiType,
      payload: safePayload,
      promptText,
      chunks: trimmedChunks,
      metadatas: context.metadatas || [],
      imageInput,
    })) ||
    buildTeacherAiFromTextbook({
      aiType,
      payload: safePayload,
      chunks: trimmedChunks,
    });

  const finalText = trimmedChunks.length ? text : appendFallbackReason(text, context);

  return {
    text: finalText,
    question_pattern: aiType === "question_paper" ? safePayload.question_pattern : undefined,
    total_marks: aiType === "question_paper" ? questionPattern.totalMarks : undefined,
    total_questions: aiType === "question_paper" ? questionPattern.totalQuestions : undefined,
    source_type: imageInput.length
      ? trimmedChunks.length
        ? "rag_vision"
        : "vision"
      : trimmedChunks.length
        ? "rag"
        : "fallback",
    sources: formatRagSources(context.metadatas || []),
    filters_used: context.filter || null,
    image_used: imageInput.length > 0,
    image_count: imageInput.length,
  };
}
