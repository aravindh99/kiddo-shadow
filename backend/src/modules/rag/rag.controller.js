import asyncHandler from "../../shared/asyncHandler.js";
import { GoogleGenAI } from "@google/genai";
import { routeRagQuestion } from "./subjectRouter.js";
import { formatGeneratedAnswerText } from "./answerFormatting.js";
import {
  isEducationalFillInBlankQuestion,
  isEquationBasedQuestion,
  solveImageQuestionWithGemini,
  solveWithGeminiFromTextbook,
} from "./geminiSolver.js";
import { buildStudentFollowupSuggestions } from "../ai-followup/aiFollowup.service.js";
import {
  chunkText,
  textToSpeech,
} from "../../shared/services/voice.service.js";
import Class from "../classes/classes.model.js";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import {
  normalizeRequestSubject,
  resolveQuestionSubject,
  SUBJECT_REQUIRED_RESPONSE,
  SUBJECT_INVALID_INPUT_RESPONSE,
  SUBJECT_MISMATCH_RESPONSE,
  validateGeminiSolverSubject,
  validateQuestionSubject,
} from "./subjectValidation.js";
import { relatedQuestionService } from "../related-questions/relatedQuestion.service.js";
import {
  clearRelatedQuestionState,
  findStoredRelatedQuestionSelection,
  getStoredRelatedQuestionState,
  storeRelatedQuestionState,
} from "../related-questions/relatedQuestionState.js";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const LANGUAGE_MAP = [
  { canonical: "english", aliases: ["english"] },
  { canonical: "tamil", aliases: ["tamil"] },
  { canonical: "malayalam", aliases: ["malayalam", "malayam"] },
  { canonical: "kannada", aliases: ["kannada", "kanada"] },
  { canonical: "telugu", aliases: ["telugu"] },
  { canonical: "hindi", aliases: ["hindi"] },
  { canonical: "german", aliases: ["german"] },
  { canonical: "french", aliases: ["french", "franch"] },
  { canonical: "sanskrit", aliases: ["sanskrit", "sankrit"] },
];

const detectRequestedLanguage = (question) => {
  const q = String(question || "").toLowerCase();
  for (const lang of LANGUAGE_MAP) {
    if (lang.aliases.some((a) => q.includes(a))) {
      return lang.canonical;
    }
  }
  return null;
};

const extractLanguageFromQuestionText = (question) => {
  const q = String(question || "").toLowerCase();
  if (!q) return null;

  // Examples handled:
  // "what is homophone in tamil"
  // "explain this in malayalam"
  // "answer in hindi"
  for (const lang of LANGUAGE_MAP) {
    for (const alias of lang.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const inPattern = new RegExp(`\\bin\\s+${escaped}\\b`, "i");
      const onlyPattern = new RegExp(`\\b${escaped}\\s+only\\b`, "i");
      if (inPattern.test(q) || onlyPattern.test(q)) {
        return lang.canonical;
      }
    }
  }

  return null;
};

const extractTaggedLanguage = (question) => {
  const q = String(question || "");
  const m = q.match(/\[\s*target_language\s*:\s*([a-zA-Z_ -]+)\s*\]/i);
  if (!m?.[1]) return null;
  return normalizeLanguage(m[1]);
};

const stripLanguageTag = (question) =>
  String(question || "")
    .replace(/\n?\s*\[\s*target_language\s*:\s*[a-zA-Z_ -]+\s*\]\s*/gi, " ")
    .trim();

const stripLanguageInstructionForSearch = (question) => {
  let normalized = String(question || "");

  for (const lang of LANGUAGE_MAP) {
    for (const alias of lang.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      normalized = normalized
        .replace(new RegExp(`\\bin\\s+${escaped}\\b`, "gi"), " ")
        .replace(new RegExp(`\\b${escaped}\\s+only\\b`, "gi"), " ")
        .replace(new RegExp(`\\banswer\\s+in\\s+${escaped}\\b`, "gi"), " ")
        .replace(new RegExp(`\\bexplain\\s+in\\s+${escaped}\\b`, "gi"), "explain ")
        .replace(new RegExp(`\\btranslate\\s+(?:this\\s+)?(?:to|into)\\s+${escaped}\\b`, "gi"), " ");
    }
  }

  return normalized.replace(/\s+/g, " ").trim();
};

const normalizeLanguage = (value) => {
  if (!value) return null;
  const lower = String(value).toLowerCase().trim();
  for (const lang of LANGUAGE_MAP) {
    if (lang.canonical === lower || lang.aliases.includes(lower)) {
      return lang.canonical;
    }
  }
  return null;
};

const LANGUAGE_CODES = {
  english: "en",
  tamil: "ta",
  malayalam: "ml",
  kannada: "kn",
  telugu: "te",
  hindi: "hi",
  german: "de",
  french: "fr",
  sanskrit: "sa",
};

const LANGUAGE_DISPLAY = {
  english: "English",
  tamil: "Tamil",
  malayalam: "Malayalam",
  kannada: "Kannada",
  telugu: "Telugu",
  hindi: "Hindi",
  german: "German",
  french: "French",
  sanskrit: "Sanskrit",
};

const applyNoStoreHeaders = (res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
};

const IMAGE_QUESTION_TEXT = "Uploaded image question";
const IMAGE_OTHER_SUBJECTS_UNSUPPORTED_MESSAGE =
  "Image upload is supported only for Maths, Physics, and Chemistry questions. Please type your Other Subjects question instead.";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const NONE_OF_THE_ABOVE_PATTERN = /^\s*none\s+of\s+the\s+above\s*$/i;

const isTruthyRequestFlag = (value) =>
  value === true || String(value || "").trim().toLowerCase() === "true";

const getRequestTextValue = (value) => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(getRequestTextValue).find(Boolean) || "";
  }
  if (typeof value === "object") {
    return getRequestTextValue(
      value.question ??
        value.text ??
        value.value ??
        value.label ??
        value.title ??
        value.name
    );
  }

  return "";
};

const getFirstNonEmptyValue = (...values) =>
  values.map(getRequestTextValue).find(Boolean) || null;

const getRelatedQuestionByIndex = (questions, index) => {
  const list = Array.isArray(questions) ? questions : [];
  const selectedIndex = Number(index);
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= list.length) {
    return null;
  }

  return getRequestTextValue(list[selectedIndex]) || null;
};

const normalizeRequestComparable = (value) =>
  String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

const findUploadedImageFile = (req) => {
  const files = req.files;

  if (Array.isArray(files)) {
    return files.find((file) => file?.buffer);
  }

  return (
    req.file ||
    files?.image?.[0] ||
    files?.file?.[0] ||
    files?.questionImage?.[0] ||
    null
  );
};

const parseImageDataPayload = (body = {}) => {
  const rawImageData =
    body.image_data ||
    body.imageData ||
    body.photo_data ||
    body.photoData ||
    body.image_base64 ||
    body.imageBase64 ||
    body.questionImage ||
    body.image ||
    body.base64 ||
    body.data;

  if (!rawImageData) {
    return null;
  }

  console.log("IMAGE_BASE64_RECEIVED");

  const rawText = String(rawImageData).trim();
  const dataUrlMatch = rawText.match(IMAGE_DATA_URL_PATTERN);
  const mimeType =
    dataUrlMatch?.[1] || body.mime_type || body.mimeType || body.content_type || body.contentType;
  const imageBase64 = dataUrlMatch?.[2] || rawText;

  if (!ALLOWED_IMAGE_MIME_TYPES.has(String(mimeType || "").toLowerCase())) {
    return null;
  }

  const imageBuffer = Buffer.from(imageBase64, "base64");
  if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
    return null;
  }

  return {
    imageBase64: imageBuffer.toString("base64"),
    mimeType: String(mimeType).toLowerCase(),
  };
};

const hasImageDataPayload = (body = {}) =>
  Boolean(
    body.image_data ||
      body.imageData ||
      body.photo_data ||
      body.photoData ||
      body.image_base64 ||
      body.imageBase64 ||
      body.questionImage ||
      body.image ||
      body.base64
  );

const summarizeUploadedFile = (file) =>
  file
    ? {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        normalizedMimeType: file.normalizedMimeType,
        size: file.size,
        hasBuffer: Boolean(file.buffer),
        bufferLength: file.buffer?.length || 0,
      }
    : file;

const summarizeUploadedFiles = (files) => {
  if (Array.isArray(files)) {
    return files.map(summarizeUploadedFile);
  }

  if (files && typeof files === "object") {
    return Object.fromEntries(
      Object.entries(files).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(summarizeUploadedFile) : summarizeUploadedFile(value),
      ])
    );
  }

  return files;
};

const logImageRequestDebug = (req, body) => {
  console.log("IMAGE REQUEST RECEIVED");
  console.log("req.file:", summarizeUploadedFile(req.file));
  console.log("req.files:", summarizeUploadedFiles(req.files));
  console.log("req.body:", body);
};

const buildImageSubjectGuardQuestion = ({ question, selectedSubject }) =>
  [
    `Selected subject: ${selectedSubject}.`,
    "Before solving the uploaded image, determine the primary academic subject of the question.",
    "If the primary subject does not match the selected subject, return exactly:",
    SUBJECT_MISMATCH_RESPONSE.message,
    "Do not solve the question when the subject does not match.",
    "If the subject matches, solve the uploaded question normally.",
    question ? `User question/instruction: ${question}` : "",
  ]
    .filter(Boolean)
    .join("\n");

const isSubjectMismatchAnswer = (answer) =>
  String(answer || "")
    .trim()
    .replace(/^["']|["']$/g, "") === SUBJECT_MISMATCH_RESPONSE.message;

const normalizeInlineLatexToText = (value) => {
  let text = String(value || "");
  let previous = "";

  while (text !== previous) {
    previous = text;
    text = text.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1) ÷ ($2)");
  }

  return text
    .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\mathrm\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "×")
    .replace(/\\pi/g, "π")
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
    .replace(/\^\{2\}/g, "²")
    .replace(/\^2/g, "²")
    .replace(/\^\{3\}/g, "³")
    .replace(/\^3/g, "³")
    .replace(/_\{([^{}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "");
};

const formatImageAnswerForStudent = (answer) => {
  const cleaned = normalizeInlineLatexToText(answer)
    .replace(/\$\$?/g, "")
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/\*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) return cleaned;

  const withHeading = /^Step-by-Step Solution:/i.test(cleaned)
    ? cleaned
    : `Step-by-Step Solution:\n\n${cleaned}`;

  return withHeading
    .replace(/\bCalculation:/gi, "Operation:")
    .replace(/\bWork(?:ing)?:/gi, "Operation:")
    .replace(/\bAnswer:/gi, "Final Answer:")
    .trim();
};

const sanitizeTamilOutput = (value) => {
  const text = String(value || "");
  if (!text) return text;

  return text
    // Remove private-use glyphs and replacement chars that often render as boxes.
    .replace(/[\uE000-\uF8FF\uFFFD]/g, "")
    // Remove zero-width / BOM artifacts from copied PDF text.
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Remove visible square/box glyph symbols that appear in some Tamil outputs.
    .replace(/[□▢▣▤▥▦▧▨▩■◻◼◽◾]/g, "")
    // Keep visible line breaks tidy after cleanup.
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const containsTamil = (value) => /[\u0B80-\u0BFF]/.test(String(value || ""));

const translateViaGtx = async (text, targetLanguage) => {
  const targetCode = LANGUAGE_CODES[targetLanguage];
  if (!targetCode) return text;

  const sourceText = String(text || "");

  // Try full-text translation first.
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetCode
    )}&dt=t&q=${encodeURIComponent(sourceText)}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const translated = Array.isArray(data?.[0])
        ? data[0].map((part) => part?.[0] || "").join("")
        : "";
      if (translated?.trim()) return translated;
    }
  } catch {
    // Fall back to line-by-line translation below.
  }

  const lines = sourceText.split("\n");
  const out = [];

  for (const line of lines) {
    if (!line.trim()) {
      out.push(line);
      continue;
    }
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        targetCode
      )}&dt=t&q=${encodeURIComponent(line)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        out.push(line);
        continue;
      }
      const data = await resp.json();
      const translated = Array.isArray(data?.[0])
        ? data[0].map((part) => part?.[0] || "").join("")
        : "";
      out.push(translated || line);
    } catch {
      out.push(line);
    }
  }

  return out.join("\n");
};

const translateAnswer = async (text, targetLanguage) => {
  if (!text || !targetLanguage || targetLanguage === "english") {
    return text;
  }

  const languageHints = {
    tamil:
      "Output must be in Tamil only, using Tamil script only. Do not use Devanagari. Do not mix Hindi words.",
    malayalam:
      "Output must be in Malayalam only, using Malayalam script only.",
    kannada:
      "Output must be in Kannada only, using Kannada script only.",
    telugu:
      "Output must be in Telugu only, using Telugu script only.",
    hindi:
      "Output must be in Hindi only, using Devanagari script only.",
    sanskrit:
      "Output must be in Sanskrit only, using Devanagari script. Use formal Sanskrit vocabulary, not modern Hindi phrasing.",
    german:
      "Output must be in clear German suitable for school students.",
    french:
      "Output must be in clear French suitable for school students.",
  };

  const scriptRegex = {
    tamil: /[\u0B80-\u0BFF]/g,
    malayalam: /[\u0D00-\u0D7F]/g,
    kannada: /[\u0C80-\u0CFF]/g,
    telugu: /[\u0C00-\u0C7F]/g,
    hindi: /[\u0900-\u097F]/g,
    sanskrit: /[\u0900-\u097F]/g, // Devanagari
  };

  const isTranslationQualityGood = (candidate, original, lang) => {
    const output = String(candidate || "").trim();
    const source = String(original || "").trim();
    if (!output) return false;

    const unchanged = output.toLowerCase() === source.toLowerCase();
    if (unchanged) return false;

    if (scriptRegex[lang]) {
      const scriptCount = (output.match(scriptRegex[lang]) || []).length;
      const alphaCount = (output.match(/[A-Za-z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0CFF\u0C80-\u0CFF\u0D00-\u0D7F]/g) || []).length;
      // Relaxed threshold: allow mixed technical terms but require visible target script.
      if (alphaCount > 20 && scriptCount < Math.max(6, Math.floor(alphaCount * 0.08))) {
        return false;
      }
    } else if (lang !== "english") {
      // For Latin-script target languages (German/French), reject clearly-English output.
      const englishHits = (output.toLowerCase().match(/\b(the|and|is|are|what|words|textbook|answer|clipped|formed)\b/g) || []).length;
      if (englishHits >= 4) return false;
    }

    return true;
  };

  const isLikelyWrongScript = (value, lang) => {
    const textValue = String(value || "");
    if (!scriptRegex[lang]) return false;
    const scriptChars = (textValue.match(scriptRegex[lang]) || []).length;
    const alphaChars = (textValue.match(/[A-Za-z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0CFF\u0C80-\u0CFF\u0D00-\u0D7F]/g) || []).length;
    return alphaChars > 20 && scriptChars < Math.max(8, Math.floor(alphaChars * 0.2));
  };

  const hasTooMuchLatin = (value) => {
    const textValue = String(value || "");
    const latin = (textValue.match(/[A-Za-z]/g) || []).length;
    const allLetters = (textValue.match(/[A-Za-z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0CFF\u0D00-\u0D7F]/g) || []).length;
    if (allLetters === 0) return false;
    return latin / allLetters > 0.35;
  };

  const isProbablyEnglish = (value) => {
    const txt = String(value || "").toLowerCase();
    const hits = (txt.match(/\b(the|and|is|are|what|words|textbook|answer|clipped|formed)\b/g) || []).length;
    return hits >= 4;
  };

  let finalText = text;
  let bestCandidate = "";
  if (ai) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const targetName = LANGUAGE_DISPLAY[targetLanguage] || targetLanguage;
      const prompt = [
        "You are a professional educational translator for K-12 textbook content.",
        `Task: Translate SOURCE_TEXT into ${targetName}.`,
        "",
        "Hard requirements (must follow all):",
        `1) Output language must be strictly ${targetName}.`,
        "2) Preserve original meaning exactly. Do not add, remove, or invent facts.",
        "3) Preserve structure exactly: headings, bullets, numbering, and line breaks.",
        "4) Translate full content. Do not leave full sentences in English.",
        "5) Keep proper nouns as-is if needed, but translate all common words.",
        "6) Return plain translated text only. No notes, no labels, no markdown fences, no code block.",
        "7) Keep numerals, punctuation, and list markers stable.",
        languageHints[targetLanguage] || "",
        attempt > 0
          ? "Previous output quality failed language/script checks. Regenerate with strict compliance."
          : "",
        "",
        "SOURCE_TEXT:",
        text,
      ]
        .filter(Boolean)
        .join("\n");

      let result = null;
      try {
        result = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });
      } catch (err) {
        // Continue to next attempt / fallback translator instead of returning English directly.
        continue;
      }

      const candidate =
        result?.text ||
        result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
        "";
      const normalized = candidate.trim();
      if (!normalized) continue;
      finalText = normalized;
      if (
        normalized.toLowerCase() !== String(text).trim().toLowerCase() &&
        (!bestCandidate || normalized.length > bestCandidate.length)
      ) {
        bestCandidate = normalized;
      }

      const wrongScript =
        isLikelyWrongScript(finalText, targetLanguage) ||
        (scriptRegex[targetLanguage] && hasTooMuchLatin(finalText));
      const likelyEnglish =
        targetLanguage !== "english" &&
        !scriptRegex[targetLanguage] &&
        isProbablyEnglish(finalText);

      if (!wrongScript && !likelyEnglish && isTranslationQualityGood(finalText, text, targetLanguage)) {
        break;
      }
    }
  }

  const stillBad =
    !isTranslationQualityGood(finalText, text, targetLanguage);

  if (stillBad) {
    const gtx = await translateViaGtx(text, targetLanguage);
    if (gtx && gtx.trim() && isTranslationQualityGood(gtx, text, targetLanguage)) {
      finalText = gtx;
    } else if (gtx && gtx.trim() && gtx.trim().toLowerCase() !== String(text).trim().toLowerCase()) {
      // Accept changed fallback even if strict validator is unsure.
      finalText = gtx.trim();
    }
  }

  if (!finalText || finalText.trim().toLowerCase() === String(text).trim().toLowerCase()) {
    if (bestCandidate) return bestCandidate;
  }

  if (targetLanguage === "tamil") {
    return sanitizeTamilOutput(finalText || text);
  }

  return finalText || text;
};

const normalizeClassLevel = (value) => {
  if (!value) return value;
  const str = String(value).trim().toLowerCase();
  const digitMatch = str.match(/\d+/);
  if (digitMatch) return digitMatch[0];
  return str.replace(/^class\s*/, "");
};

const shouldAttachStudentFollowups = ({ userRole, question, answer }) =>
  userRole === "student" &&
  String(question || "").trim() &&
  String(answer || "").trim();

const PERSONAL_CHAT_PATTERN =
  /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening|night)|thanks?|thank\s+you|bye|goodbye|how\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name|tell\s+me\s+a\s+joke|can\s+you\s+help\s+me)\b/i;
const STUDY_QUESTION_INTENT_PATTERN =
  /\b(?:what\s+is|what\s+are|how\s+many|how\s+much|why|define|explain|describe|state|list|observe|write(?:\s+down)?|solve|calculate|find|determine|evaluate|compute|simplify|derive|prove|verify|prepare|record|journal(?:ise|ize)?|pass\s+journal\s+entries|fill|complete|true\s+or\s+false|choose|identify|differentiate|distinguish|compare|arrange|order)\b/i;
const MATHS_STUDY_PATTERN =
  /\b(?:maths?|mathematics|numbers?|number\s+systems?|numbering\s+systems?|indian\s+numbering\s+systems?|international\s+numbering\s+systems?|place\s+values?|face\s+values?|expanded\s+forms?|standard\s+forms?|digits?|smallest\s+\d+\s*-?\s*digit|largest\s+\d+\s*-?\s*digit|smallest\s+number|largest\s+number|comparison\s+of\s+numbers?|compare\s+numbers?|ascending\s+order|descending\s+order|greater\s+than|less\s+than|ones?|tens?|hundreds?|thousands?|ten\s+thousands?|lakhs?|crores?|commas?|groups?|arithmetic|addition|subtraction|multiplication|division|calculations?|calculate|formulas?|geometry|algebra|measurements?|word\s+problems?|mathematical\s+(?:concepts?|word\s+problems?)|fractions?|decimals?|percentages?|ratio|sum|difference|product|quotient|multiples?|factors?|prime|composite|successor|predecessor|perimeter|area|volume|equations?)\b/i;
const INDIAN_GROUPED_NUMBER_PATTERN = /\b\d{1,2},\d{2},\d{2},\d{3}\b/;
const INTERNATIONAL_FORMATTING_PATTERN =
  /\b(?:international\s+(?:system|numbering\s+system)|standard\s+(?:numeral|number)\s+(?:grouping|format(?:ting)?)|place\s+value\s+format(?:ting)?|(?:use|insert|put|place)\s+commas?|write\b.+\b(?:with|using)\s+commas?)\b/i;
const MATHS_REASONING_PATTERN =
  /\b(?:largest|smallest|greater|least|greatest|compare|comparison|ascending|descending|arrange|arranging|order|ordering|form|forming|make|construct|construction|write\s+any|digit\s+placement|with\s+constraints?|conditions?|rules?|ten\s+lakhs?|ten\s+thousand(?:s|th)?|lakhs?|crores?)\b/i;
const NUMERIC_COMPARISON_OR_ORDER_PATTERN =
  /\b(?:largest|smallest|greater|least|greatest|compare|comparison|ascending|descending)\b/i;
const NUMBER_CONSTRUCTION_PATTERN =
  /\b(?:\d+\s*-?\s*digit\s+number|digit\s+number|number\s+with|with\s+\d+\s+in\s+(?:the\s+)?(?:ones?|tens?|hundreds?|thousands?|ten\s+thousands?|lakhs?|ten\s+lakhs?|crores?)\s+place)\b/i;
const PHYSICS_STUDY_PATTERN =
  /\b(?:physics|laws?|formula|formulas|numerical\s+problems?|theory\s+concepts?|force|motion|speed|velocity|acceleration|energy|power|work|current|voltage|resistance|ohm'?s\s+law|newton'?s\s+laws?|magnetism|reflection|refraction|lens|mirror|waves?|sound|light)\b/i;
const CHEMISTRY_STUDY_PATTERN =
  /\b(?:chemistry|chemical\s+concepts?|formulas?|reactions?|definitions?|calculations?|acid|base|salt|solution|mixture|moles?|molarity|atoms?|molecules?|elements?|compounds?|periodic\s+table|valency|oxidation|reduction|chemical\s+equation)\b/i;
const ACCOUNTS_STUDY_PATTERN =
  /\b(?:accounts?|accountancy|journal|ledger|debit|credit|accounting\s+concepts?|calculations?|trial\s+balance|balance\s+sheet|cash\s+book|assets?|liabilities|capital|revenue|expense|depreciation|goodwill)\b/i;
const COMMERCE_STUDY_PATTERN =
  /\b(?:commerce|business\s+(?:concepts?|studies)|economics\s+concepts?|commerce\s+theory|demand|supply|market|trade|consumer|producer|partnership|shares?|debentures?|gst|stock|inventory)\b/i;
const SUBJECT_BASED_STUDY_PATTERN = new RegExp(
  [
    MATHS_STUDY_PATTERN.source,
    PHYSICS_STUDY_PATTERN.source,
    CHEMISTRY_STUDY_PATTERN.source,
    ACCOUNTS_STUDY_PATTERN.source,
    COMMERCE_STUDY_PATTERN.source,
  ].join("|"),
  "i"
);
const STUDY_STATEMENT_PATTERN =
  /\b(?:is|are|was|were|means|refers|called|known|equals?|separate|separates|groups?|according\s+to|formula\s+for|definition\s+of)\b/i;

const isSubjectBasedStudyQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return false;

  const hasSubjectSignal = SUBJECT_BASED_STUDY_PATTERN.test(text);
  if (!hasSubjectSignal) return false;

  const isOnlyPersonalChat = PERSONAL_CHAT_PATTERN.test(text) && !STUDY_QUESTION_INTENT_PATTERN.test(text);
  if (isOnlyPersonalChat) return false;

  const hasStudyIntent = STUDY_QUESTION_INTENT_PATTERN.test(text);
  const hasNumberStudySignal =
    /\d/.test(text) && (MATHS_STUDY_PATTERN.test(text) || INDIAN_GROUPED_NUMBER_PATTERN.test(text));
  const hasSubjectStatement = STUDY_STATEMENT_PATTERN.test(text);

  return hasStudyIntent || hasNumberStudySignal || hasSubjectStatement;
};

const countNumericTokens = (text) => (String(text || "").match(/\d[\d,]*/g) || []).length;

const isMathsFormattingQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text || /\bindian\s+numbering\s+system\b/i.test(text)) return false;
  return /\d/.test(text) && INTERNATIONAL_FORMATTING_PATTERN.test(text);
};

const isMathsReasoningQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return false;

  const numericCount = countNumericTokens(text);
  const hasMathSignal =
    MATHS_STUDY_PATTERN.test(text) ||
    INDIAN_GROUPED_NUMBER_PATTERN.test(text) ||
    NUMBER_CONSTRUCTION_PATTERN.test(text) ||
    (numericCount >= 2 && NUMERIC_COMPARISON_OR_ORDER_PATTERN.test(text));
  const hasReasoningSignal =
    MATHS_REASONING_PATTERN.test(text) ||
    (/\b(?:which\s+one|which)\b/i.test(text) && /\b(?:largest|smallest|greater|least|greatest)\b/i.test(text));

  return hasMathSignal && hasReasoningSignal && (numericCount >= 1 || NUMBER_CONSTRUCTION_PATTERN.test(text));
};


const normalizeSupportedSubject = (subject) => {
  const normalized = String(subject || "").trim().toLowerCase();
  if (normalized === "maths" || normalized === "math") return "Maths";
  if (normalized === "physics") return "Physics";
  if (normalized === "chemistry") return "Chemistry";
  return null;
};

const buildSubjectRoutingText = (question, subject) => {
  const text = String(question || "").trim();
  const supportedSubject = normalizeSupportedSubject(subject);
  return supportedSubject ? `${text} ${supportedSubject}` : text;
};

export const detectDirectGeminiTextRoute = (question, subject) => {
  const supportedSubject = normalizeSupportedSubject(subject);
  const classificationQuestion = buildSubjectRoutingText(question, supportedSubject);
  const educationalFillInBlank = isEducationalFillInBlankQuestion(classificationQuestion);

  if (supportedSubject === "Maths" && isMathsReasoningQuestion(classificationQuestion)) {
    return "maths_reasoning";
  }

  if (
    !supportedSubject &&
    !/\d/.test(String(question || "")) &&
    /\b(?:arrange|order)\b/i.test(String(question || "")) &&
    /\bnumbers?\b/i.test(String(question || ""))
  ) {
    return null;
  }

  if (isEquationBasedQuestion(classificationQuestion) && !educationalFillInBlank) {
    return "equation_calculation";
  }

  if (isMathsReasoningQuestion(classificationQuestion)) {
    return "maths_reasoning";
  }

  // Subject-based study questions bypass RAG because the answer may require
  // reasoning and may not exist inside retrieved chunks.
  if (isSubjectBasedStudyQuestion(classificationQuestion)) {
    return "subject_study_question";
  }

  if (educationalFillInBlank) {
    return "academic_fill_in_blank";
  }

  if (isMathsFormattingQuestion(classificationQuestion)) {
    return "maths_formatting";
  }

  return null;
};

export const selectDirectGeminiTextRoute = ({ question, subject, hasBookScope = false }) => {
  const supportedSubject = normalizeSupportedSubject(subject);
  const detectedRoute = detectDirectGeminiTextRoute(question, supportedSubject);

  if (!hasBookScope || supportedSubject || detectedRoute === "maths_reasoning") {
    return detectedRoute;
  }

  return null;
};

const normalizeFollowUpComparable = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const FOLLOW_UP_REFERENCE_PATTERN =
  /\b(this|that|it|they|them|these|those|above|previous|earlier|same|more|detail|brief|short|summary|meaning|mean|continue|again|he|she|his|her|their|its|him)\b/i;
const FOLLOW_UP_DIRECT_PATTERN =
  /^(?:in\s+detail|in\s+short|briefly|shortly|more\s+detail|more\s+details|explain\s+more|tell\s+me\s+more|continue|elaborate|what\s+about\s+(?:this|that|it)|what\s+does\s+(?:this|that|it)\s+mean)\b/i;
const FOLLOW_UP_FACT_PATTERN =
  /\b(how\s+many|how\s+much|how\s+long|how\s+old|which\s+year|what\s+year|whose|whom|where|when|who|meaning|mean|meant|duration|birthplace|born|capital|lasted\s+from)\b/i;

const isLikelyFollowUpQuestion = (question) => {
  const normalized = normalizeFollowUpComparable(question);
  if (!normalized) return false;

  const words = normalized.split(/\s+/).filter(Boolean);

  if (FOLLOW_UP_DIRECT_PATTERN.test(normalized)) {
    return true;
  }

  if (words.length <= 6 && FOLLOW_UP_REFERENCE_PATTERN.test(normalized)) {
    return true;
  }

  if (
    words.length <= 8 &&
    /^(why|how|when|where|who)\b/.test(normalized) &&
    /\b(this|that|it|they|these|those|he|she|his|her|their|its|him)\b/.test(normalized)
  ) {
    return true;
  }

  if (
    words.length <= 8 &&
    /\?$/.test(String(question || "").trim()) &&
    !/\b(?:about|explain|describe|write|note|detail|brief|short)\b/.test(normalized)
  ) {
    return true;
  }

  if (
    words.length <= 16 &&
    FOLLOW_UP_FACT_PATTERN.test(normalized) &&
    !/^\b(?:what\s+is|what\s+are|define|describe|explain|write\s+about|tell\s+me\s+about)\b/.test(
      normalized
    )
  ) {
    return true;
  }

  return false;
};

const buildFollowUpAwareQuestion = ({ question, previousQuestion }) => {
  const current = String(question || "").trim();
  const previous = String(previousQuestion || "").trim();

  if (!current || !previous) {
    return current;
  }

  const normalized = normalizeFollowUpComparable(current);

  if (
    /^(?:in\s+detail|in\s+short|briefly|shortly|more\s+detail|more\s+details|explain\s+more|tell\s+me\s+more|continue|elaborate)$/i.test(
      normalized
    )
  ) {
    return `${previous} ${current}`;
  }

  return `${current} in the context of ${previous}`;
};

const getPreviousRagChatLog = async (userId) => {
  if (!userId) return null;

  return AiChatLog.findOne({
    where: { user_id: userId, ai_type: "rag" },
    order: [["created_at", "DESC"]],
  });
};

const saveRagChatLog = async ({
  userId,
  question,
  answer,
  classLevel,
  modelUsed = "rag",
  tokensUsed = 0,
}) => {
  if (!userId || !question || !answer) return;

  try {
    await AiChatLog.create({
      user_id: userId,
      user_query: String(question).trim(),
      ai_response: String(answer).trim(),
      tokens_used: Number(tokensUsed) || 0,
      model_used: modelUsed,
      ai_type: "rag",
      class_level: classLevel || null,
    });
  } catch (err) {
    console.error("Failed to save RAG chat log:", err?.message || err);
  }
};

export const askQuestion = asyncHandler(async (req, res) => {
  applyNoStoreHeaders(res);

  const payload = req.method === "GET" ? req.query : req.body;
  console.log("RAG_CONTROLLER_ENTRY", {
    requestBody: req.method === "GET" ? req.query : req.body,
    selectedSubject: payload?.selectedSubject ?? payload?.selected_subject ?? null,
    subject: payload?.subject ?? null,
    question: payload?.question ?? null,
    query: payload?.query ?? null,
  });

  const {
    question,
    query,
    selectedSubject,
    selected_subject,
    subject,
    solverMode,
    classLevel,
    language,
    preferredLanguage,
    lang,
    sourcePath,
    source_path,
    bookPath,
    book_path,
    pdfPath,
    pdf_path,
    currentBook,
    current_book,
    selectedBook,
    selected_book,
    book,
    chapter,
    selectedQuestion,
    selected_question,
    selectedQuestionText,
    selected_question_text,
    selectedRelatedQuestion: selectedRelatedQuestionPayload,
    selected_related_question: selected_related_questionPayload,
    relatedQuestion,
    related_question,
    relatedQuestionText,
    related_question_text,
    selectedOption,
    selected_option,
    selectedAnswer,
    selected_answer,
    selectedIndex,
    selected_index,
    relatedQuestions,
    related_questions,
    originalQuestion,
    original_question,
    originalUserQuestion,
    original_user_question,
    initialQuestion,
    initial_question,
    userQuestion,
    user_question,
    skipRelatedQuestions,
    skip_related_questions,
    relatedQuestionSelected,
    related_question_selected,
    noneOfTheAbove,
    none_of_the_above,
  } = payload;

  const rawQuestionText = getFirstNonEmptyValue(question, query);
  const relatedQuestionState = getStoredRelatedQuestionState(req);
  const storedSelectedRelatedQuestion = findStoredRelatedQuestionSelection(
    relatedQuestionState,
    rawQuestionText
  );
  const isStoredNoneOfTheAboveSelection = Boolean(
    relatedQuestionState && NONE_OF_THE_ABOVE_PATTERN.test(String(rawQuestionText || ""))
  );
  const isStoredOriginalQuestionSelection = Boolean(
    relatedQuestionState &&
      rawQuestionText &&
      normalizeRequestComparable(rawQuestionText) ===
        normalizeRequestComparable(relatedQuestionState.originalQuestion)
  );
  const isStoredChangedQuestionSelection = Boolean(
    relatedQuestionState &&
      rawQuestionText &&
      !isStoredNoneOfTheAboveSelection &&
      !isStoredOriginalQuestionSelection &&
      normalizeRequestComparable(rawQuestionText) !==
        normalizeRequestComparable(relatedQuestionState.originalQuestion)
  );
  const selectedRelatedQuestion = getFirstNonEmptyValue(
    selectedQuestion,
    selected_question,
    selectedQuestionText,
    selected_question_text,
    selectedRelatedQuestionPayload,
    selected_related_questionPayload,
    relatedQuestion,
    related_question,
    relatedQuestionText,
    related_question_text,
    selectedOption,
    selected_option,
    selectedAnswer,
    selected_answer,
    getRelatedQuestionByIndex(relatedQuestions || related_questions, selectedIndex ?? selected_index),
    storedSelectedRelatedQuestion
  );
  const originalRelatedQuestion = getFirstNonEmptyValue(
    originalQuestion,
    original_question,
    originalUserQuestion,
    original_user_question,
    initialQuestion,
    initial_question,
    userQuestion,
    user_question,
    isStoredNoneOfTheAboveSelection || isStoredOriginalQuestionSelection
      ? relatedQuestionState?.originalQuestion
      : null
  );
  const isNoneOfTheAboveSelection =
    isTruthyRequestFlag(noneOfTheAbove) ||
    isTruthyRequestFlag(none_of_the_above) ||
    isTruthyRequestFlag(skipRelatedQuestions) ||
    isTruthyRequestFlag(skip_related_questions) ||
    isStoredNoneOfTheAboveSelection ||
    isStoredOriginalQuestionSelection ||
    NONE_OF_THE_ABOVE_PATTERN.test(String(selectedRelatedQuestion || ""));
  const hasRelatedQuestionSelectionFlag =
    isTruthyRequestFlag(relatedQuestionSelected) ||
    isTruthyRequestFlag(related_question_selected) ||
    Boolean(storedSelectedRelatedQuestion) ||
    isStoredChangedQuestionSelection;
  const effectiveSelectedRelatedQuestion =
    selectedRelatedQuestion ||
    (isStoredChangedQuestionSelection ? rawQuestionText : null) ||
    (!isNoneOfTheAboveSelection && hasRelatedQuestionSelectionFlag
      ? getFirstNonEmptyValue(question, query)
      : null);
  const hasRelatedQuestionContinuationSignal = Boolean(
    effectiveSelectedRelatedQuestion ||
      originalRelatedQuestion ||
      isNoneOfTheAboveSelection ||
      hasRelatedQuestionSelectionFlag
  );
  const effectiveSelectedSubject =
    selectedSubject || selected_subject || subject || (hasRelatedQuestionContinuationSignal ? "other_subjects" : null);
  const requestQuestion =
    question ||
    query ||
    (isNoneOfTheAboveSelection ? originalRelatedQuestion : effectiveSelectedRelatedQuestion) ||
    originalRelatedQuestion ||
    effectiveSelectedRelatedQuestion;
  const isSolverMode = solverMode === true || solverMode === "true";
  const normalizedSelectedSubject = normalizeRequestSubject(effectiveSelectedSubject);

  const uploadedFile = findUploadedImageFile(req);
  const imageInput = uploadedFile
    ? {
        imageBase64: uploadedFile.buffer.toString("base64"),
        mimeType: uploadedFile.normalizedMimeType || uploadedFile.mimetype,
      }
    : parseImageDataPayload(payload);
  const hasUploadedImagePayload = Boolean(
    uploadedFile || imageInput || hasImageDataPayload(payload)
  );

  if (hasUploadedImagePayload) {
    logImageRequestDebug(req, payload);
  }

  if (uploadedFile) {
    console.log("IMAGE_FILE_RECEIVED");
  }

  if (hasUploadedImagePayload && !imageInput) {
    console.log("EARLY RETURN - Missing Image");
    return res.status(400).json({ message: "Image is required" });
  }

  if (!normalizedSelectedSubject) {
    return res.status(400).json(SUBJECT_REQUIRED_RESPONSE);
  }

  const resolvedSubject = resolveQuestionSubject({
    question: requestQuestion,
    selectedSubject: effectiveSelectedSubject,
    subject: effectiveSelectedSubject,
  });
  if (
    hasUploadedImagePayload &&
    requestQuestion &&
    validateQuestionSubject({
      question: requestQuestion,
      selectedSubject: effectiveSelectedSubject,
      subject: effectiveSelectedSubject,
    }).shouldReject
  ) {
    if (hasUploadedImagePayload) {
      console.log("EARLY RETURN - Subject Mismatch");
    }
    return res.status(400).json(SUBJECT_MISMATCH_RESPONSE);
  }

  const voice = req.query.voice === "true";
  const headerLanguage = req.headers["x-chat-language"];
  const queryLanguage = req.query.lang;

  if (hasUploadedImagePayload) {
    if (normalizedSelectedSubject === "Other Subjects") {
      console.log("EARLY RETURN - Other Subjects");
      return res.status(400).json({
        message: IMAGE_OTHER_SUBJECTS_UNSUPPORTED_MESSAGE,
      });
    }
  }

  let cleanedQuestion = requestQuestion ? stripLanguageTag(requestQuestion) : "";

  if (imageInput) {
    try {
      const imageQuestionForSolver = buildImageSubjectGuardQuestion({
        question: cleanedQuestion,
        selectedSubject: normalizedSelectedSubject,
      });
      console.log(`SELECTED_SUBJECT = ${normalizedSelectedSubject || "Unknown"}`);
      console.log("Calling solveImageQuestionWithGemini...");
      const answer = await solveImageQuestionWithGemini({
        ...imageInput,
        question: imageQuestionForSolver,
      });
      if (isSubjectMismatchAnswer(answer)) {
        console.log("IMAGE_VALIDATION_RESULT = MISMATCH");
        console.log("EARLY RETURN - Subject Mismatch");
        return res.status(400).json(SUBJECT_MISMATCH_RESPONSE);
      }
      console.log("IMAGE_VALIDATION_RESULT = MATCH");
      console.log("Image Answer Generated");
      const finalAnswer =
        formatGeneratedAnswerText(formatImageAnswerForStudent(answer)) ||
        "I could not generate an answer from the image right now.";

      if (isSolverMode) {
        return res.json({ finalAnswer });
      }

      return res.json({
        question: cleanedQuestion || IMAGE_QUESTION_TEXT,
        answer: finalAnswer,
        sources: [],
        source_type: "gemini",
        filters_used: "image_gemini_solver",
      });
    } catch (err) {
      console.error("IMAGE_QUESTION_SOLVER_ERROR", err?.message || err);
      console.log("EARLY RETURN - OCR Failed");
      return res.status(500).json({
        message: "I could not solve the uploaded image right now. Please try again in a moment.",
      });
    }
  }

  if (!requestQuestion) {
    return res.status(400).json({ message: "Question is required" });
  }

  const taggedLanguage = extractTaggedLanguage(requestQuestion);
  let searchQuestion = stripLanguageInstructionForSearch(cleanedQuestion);
  const shouldContinueAfterRelatedQuestions = Boolean(
    hasRelatedQuestionContinuationSignal
  );
  const continuationType = isNoneOfTheAboveSelection
    ? "none_of_the_above"
    : shouldContinueAfterRelatedQuestions
      ? "related_question_selection"
      : "initial_related_questions";

  if (
    resolvedSubject.subject === "Other Subjects" &&
    shouldContinueAfterRelatedQuestions &&
    continuationType === "related_question_selection" &&
    !effectiveSelectedRelatedQuestion
  ) {
    return res.status(400).json({
      success: false,
      type: "RELATED_QUESTION_SELECTION_REQUIRED",
      message: "Selected related question is required to continue.",
      missingField: "selectedQuestion",
    });
  }

  if (
    resolvedSubject.subject === "Other Subjects" &&
    isNoneOfTheAboveSelection &&
    !originalRelatedQuestion
  ) {
    return res.status(400).json({
      success: false,
      type: "ORIGINAL_QUESTION_REQUIRED",
      message: "Original question is required when None of the Above is selected.",
      missingField: "originalQuestion",
    });
  }

  if (resolvedSubject.subject === "Other Subjects" && !shouldContinueAfterRelatedQuestions) {
    console.log("OTHER_SUBJECTS_RELATED_QUESTION_EARLY_RETURN", {
      reason: "initial_related_questions",
      rawQuestionText,
      hasStoredRelatedQuestionState: Boolean(relatedQuestionState),
      storedOriginalQuestion: relatedQuestionState?.originalQuestion || null,
      storedSelectedRelatedQuestion: storedSelectedRelatedQuestion || null,
      isStoredChangedQuestionSelection,
      isStoredOriginalQuestionSelection,
      selectedRelatedQuestion,
      effectiveSelectedRelatedQuestion,
      isNoneOfTheAboveSelection,
      shouldContinueAfterRelatedQuestions,
    });
    console.log("BEFORE_RELATED_QUESTION_SERVICE_GENERATE", {
      question: cleanedQuestion,
      selectedSubject: normalizedSelectedSubject,
      requestQuestion,
      classLevel,
      book,
      chapter,
      sourcePath: sourcePath || source_path || null,
      bookPath: bookPath || book_path || null,
      currentBook: currentBook || current_book || null,
      selectedBook: selectedBook || selected_book || null,
      user: {
        id: req.user?.id || null,
        role: req.user?.role || null,
        class_id: req.user?.class_id || null,
        school_id: req.user?.school_id || null,
      },
    });
    const questions = await relatedQuestionService.generate(cleanedQuestion);
    storeRelatedQuestionState(req, {
      originalQuestion: cleanedQuestion,
      questions,
    });
    console.log("AFTER_RELATED_QUESTION_SERVICE_GENERATE", {
      question: cleanedQuestion,
      questions,
      count: Array.isArray(questions) ? questions.length : 0,
    });
    return res.json({ questions });
  }

  if (resolvedSubject.subject === "Other Subjects" && shouldContinueAfterRelatedQuestions) {
    const relatedAnswerQuestion = isNoneOfTheAboveSelection
      ? originalRelatedQuestion || cleanedQuestion
      : effectiveSelectedRelatedQuestion || cleanedQuestion;
    cleanedQuestion = stripLanguageTag(relatedAnswerQuestion);
    searchQuestion = stripLanguageInstructionForSearch(cleanedQuestion);
  }

  const scopedBook =
    sourcePath ||
    source_path ||
    bookPath ||
    book_path ||
    pdfPath ||
    pdf_path ||
    currentBook ||
    current_book ||
    selectedBook ||
    selected_book ||
    (book ? { book, chapter } : chapter ? { chapter } : null);
  let effectiveClassLevel = normalizeClassLevel(classLevel);

  if (req.user?.role === "student" && req.user?.class_id) {
    const cls = await Class.findOne({
      where: { id: req.user.class_id, school_id: req.user.school_id },
      attributes: ["class_name"],
    });
    if (cls?.class_name) {
      effectiveClassLevel = normalizeClassLevel(cls.class_name);
    }
  }

  const previousRagLog =
    req.user?.id && isLikelyFollowUpQuestion(searchQuestion || cleanedQuestion)
      ? await getPreviousRagChatLog(req.user.id)
      : null;
  const preferPreciseAnswer = Boolean(previousRagLog);

  if (previousRagLog?.user_query) {
    searchQuestion = buildFollowUpAwareQuestion({
      question: searchQuestion || cleanedQuestion,
      previousQuestion: previousRagLog.user_query,
    });
  }

  let result;
  const detectedGeminiTextRoute = detectDirectGeminiTextRoute(cleanedQuestion);
  const directGeminiTextRoute = resolvedSubject.subject === "Other Subjects"
    ? null
    : resolvedSubject.source === "selected"
      ? "selected_subject"
      : !scopedBook || detectedGeminiTextRoute === "maths_reasoning"
        ? detectedGeminiTextRoute
        : null;
  try {
    if (directGeminiTextRoute) {
      const solverSubjectValidation = await validateGeminiSolverSubject({
        question: cleanedQuestion,
        selectedSubject: normalizedSelectedSubject,
        subject: normalizedSelectedSubject,
      });
      if (solverSubjectValidation.isInvalidInput) {
        return res.status(400).json(SUBJECT_INVALID_INPUT_RESPONSE);
      }
      if (solverSubjectValidation.shouldReject) {
        return res.status(400).json(SUBJECT_MISMATCH_RESPONSE);
      }

      const solverQuestion = resolvedSubject.subject
        ? `${cleanedQuestion}\nSubject: ${resolvedSubject.subject}`
        : cleanedQuestion;
      const answer = await solveWithGeminiFromTextbook({
        question: solverQuestion,
        chunks: [],
        metadatas: [],
      });

      result = {
        answer,
        sources: [],
        source_type: "gemini",
        answer_source: "gemini_solver",
        filters_used: `${directGeminiTextRoute}_gemini_solver`,
      };
    } else {
      if (resolvedSubject.subject === "Other Subjects" && shouldContinueAfterRelatedQuestions) {
        console.log("OTHER_SUBJECTS_RAG_CONTINUATION", {
          incomingContinuationPayload: {
            question: getRequestTextValue(question),
            query: getRequestTextValue(query),
            selectedSubject: getRequestTextValue(selectedSubject),
            selected_subject: getRequestTextValue(selected_subject),
            subject: getRequestTextValue(subject),
            selectedQuestion: getRequestTextValue(selectedQuestion),
            selected_question: getRequestTextValue(selected_question),
            selectedQuestionText: getRequestTextValue(selectedQuestionText),
            selected_question_text: getRequestTextValue(selected_question_text),
            selectedRelatedQuestion: getRequestTextValue(selectedRelatedQuestionPayload),
            selected_related_question: getRequestTextValue(selected_related_questionPayload),
            relatedQuestion: getRequestTextValue(relatedQuestion),
            related_question: getRequestTextValue(related_question),
            relatedQuestionText: getRequestTextValue(relatedQuestionText),
            related_question_text: getRequestTextValue(related_question_text),
            selectedOption: getRequestTextValue(selectedOption),
            selected_option: getRequestTextValue(selected_option),
            selectedAnswer: getRequestTextValue(selectedAnswer),
            selected_answer: getRequestTextValue(selected_answer),
            selectedIndex,
            selected_index,
            originalQuestion: getRequestTextValue(originalQuestion),
            original_question: getRequestTextValue(original_question),
            originalUserQuestion: getRequestTextValue(originalUserQuestion),
            original_user_question: getRequestTextValue(original_user_question),
            initialQuestion: getRequestTextValue(initialQuestion),
            initial_question: getRequestTextValue(initial_question),
            userQuestion: getRequestTextValue(userQuestion),
            user_question: getRequestTextValue(user_question),
            skipRelatedQuestions,
            skip_related_questions,
            relatedQuestionSelected,
            related_question_selected,
            noneOfTheAbove,
            none_of_the_above,
          },
          originalQuestion: originalRelatedQuestion || null,
          selectedRelatedQuestion: effectiveSelectedRelatedQuestion || null,
          matchedStoredRelatedQuestion: storedSelectedRelatedQuestion || null,
          isStoredChangedQuestionSelection,
          hasStoredRelatedQuestionState: Boolean(relatedQuestionState),
          effectiveRequestQuestion: cleanedQuestion,
          effectiveSelectedSubject,
          selectedSubject: normalizedSelectedSubject,
          continuationType,
          fromRelatedQuestionSelection: continuationType === "related_question_selection",
          fromNoneOfTheAbove: continuationType === "none_of_the_above",
          routeRagQuestionPayload: {
            question: searchQuestion || cleanedQuestion,
            originalQuestion: cleanedQuestion,
            preferPreciseAnswer,
            hasPreviousAnswer: Boolean(previousRagLog?.ai_response),
            classLevel: effectiveClassLevel,
            hasBookScope: Boolean(scopedBook),
            userId: req.user?.id || null,
          },
        });
      }

      const routeRagQuestionPayload = {
        question: searchQuestion || cleanedQuestion,
        originalQuestion: cleanedQuestion,
        preferPreciseAnswer,
        previousAnswer: previousRagLog?.ai_response || null,
        classLevel: effectiveClassLevel,
        bookScope: scopedBook,
        userId: req.user.id,
      };

      console.log("BEFORE_ROUTE_RAG_QUESTION", {
        routeRagQuestionPayload,
        selectedSubject: normalizedSelectedSubject,
        effectiveSelectedSubject,
        directGeminiTextRoute,
        oldWorkingRequestShape: {
          question: routeRagQuestionPayload.question,
          originalQuestion: routeRagQuestionPayload.originalQuestion,
          classLevel: routeRagQuestionPayload.classLevel,
          bookScope: routeRagQuestionPayload.bookScope,
          userId: routeRagQuestionPayload.userId,
        },
      });

      result = await routeRagQuestion(routeRagQuestionPayload);
      if (resolvedSubject.subject === "Other Subjects" && shouldContinueAfterRelatedQuestions) {
        clearRelatedQuestionState(req);
      }
    }
  } catch (err) {
    console.error("RAG ask failed:", {
      message: err?.message || String(err),
      stack: err?.stack,
      name: err?.name,
      statusCode: err?.statusCode,
      code: err?.code,
    });

    if (resolvedSubject.subject === "Other Subjects" && shouldContinueAfterRelatedQuestions) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        type: "RAG_CONTINUATION_ERROR",
        message: err?.message || "RAG continuation failed.",
        error: {
          name: err?.name || null,
          code: err?.code || null,
          statusCode: err?.statusCode || null,
        },
      });
    }

    result = {
      answer:
        "I could not generate an answer right now. Please try again in a moment.",
      sources: [],
      source_type: "fallback",
    };
  }

  const source_type = result?.source_type;
  const source = result?.source;
  const answer_source = result?.answer_source;
  const filters_used = result?.filters_used;
  const metadata_source_type = result?.metadata?.source_type;
  const hasGeminiSolverMarker = (value) => {
    const marker = String(value || "").toLowerCase();
    return marker.includes("gemini") || marker.includes("solver");
  };
  const isGeminiSolverAnswer =
    hasGeminiSolverMarker(source_type) ||
    hasGeminiSolverMarker(source) ||
    hasGeminiSolverMarker(answer_source) ||
    hasGeminiSolverMarker(filters_used) ||
    hasGeminiSolverMarker(metadata_source_type);

  const isPureRagAnswer =
    source_type === "rag" &&
    !isGeminiSolverAnswer;
  const shouldGenerateVoice = voice && isPureRagAnswer;

  console.log("VOICE_DECISION", {
    source_type,
    source,
    answer_source,
    filters_used,
    metadata_source_type,
    shouldGenerateVoice
  });

  // 🔹 TEXT-ONLY (default)
  if (!shouldGenerateVoice) {
    const inlineQuestionLanguage = extractLanguageFromQuestionText(cleanedQuestion);
    const requestedLanguage =
      inlineQuestionLanguage ||
      taggedLanguage ||
      normalizeLanguage(language) ||
      normalizeLanguage(preferredLanguage) ||
      normalizeLanguage(lang) ||
      normalizeLanguage(headerLanguage) ||
      normalizeLanguage(queryLanguage) ||
      detectRequestedLanguage(cleanedQuestion);
    let textAnswer = result.answer;

    if (requestedLanguage) {
      try {
        textAnswer = await translateAnswer(result.answer, requestedLanguage);
      } catch (err) {
        console.error("Text translation failed:", err?.message || err);
      }
    }

    if (!requestedLanguage && (containsTamil(cleanedQuestion) || containsTamil(textAnswer))) {
      textAnswer = sanitizeTamilOutput(textAnswer);
    }

    textAnswer = formatGeneratedAnswerText(textAnswer);

    await saveRagChatLog({
      userId: req.user?.id,
      question: cleanedQuestion,
      answer: textAnswer,
      classLevel: effectiveClassLevel,
      tokensUsed: result?.tokens_used || 0,
    });

    if (isSolverMode) {
      return res.json({ finalAnswer: textAnswer });
    }

    const followupSuggestions = shouldAttachStudentFollowups({
      userRole: req.user?.role,
      question: cleanedQuestion,
      answer: textAnswer,
    })
      ? buildStudentFollowupSuggestions({
          originalQuestion: cleanedQuestion,
          previousAnswer: textAnswer,
        })
      : [];

    return res.json({
      question: cleanedQuestion,
      answer: textAnswer,
      sources: result.sources,
      ...(followupSuggestions.length ? { followupSuggestions } : {}),
      ...(result.billing_warning ? { billing_warning: result.billing_warning } : {}),
    });
  }

  // 🔹 VOICE MODE
  const voiceAnswer = formatGeneratedAnswerText(result.answer);
  const sentences = chunkText(voiceAnswer);

// send subtitle text for frontend
res.setHeader("x-subtitle-text", encodeURIComponent(voiceAnswer));

res.setHeader("Content-Type", "audio/wav");
res.setHeader("Transfer-Encoding", "chunked");

for (const sentence of sentences) {
  try {
    const wavBuffer = await textToSpeech(sentence);
    res.write(wavBuffer);
  } catch (err) {
    console.error("TTS failed:", err.message);
    break;
  }
}

await saveRagChatLog({
  userId: req.user?.id,
  question: cleanedQuestion,
  answer: voiceAnswer,
  classLevel: effectiveClassLevel,
  tokensUsed: result?.tokens_used || 0,
});

res.end();
});

export const speakText = asyncHandler(async (req, res) => {
  applyNoStoreHeaders(res);

  const { text } = req.body;

  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: "Text is required" });
  }

  res.setHeader("Content-Type", "audio/wav");
  res.setHeader("Transfer-Encoding", "chunked");

  const sentences = chunkText(String(text));

  for (const sentence of sentences) {
    try {
      const wavBuffer = await textToSpeech(sentence);
      res.write(wavBuffer);
    } catch (err) {
      console.error("TTS failed:", err.message);
      break;
    }
  }

  res.end();
});

export const askImageQuestion = asyncHandler(async (req, res) => {
  applyNoStoreHeaders(res);

  try {
    const payload = req.body || {};
    const effectiveSelectedSubject =
      payload.selectedSubject || payload.selected_subject || payload.subject;
    const uploadedFile = findUploadedImageFile(req);
    const imageInput = uploadedFile
      ? {
          imageBase64: uploadedFile.buffer.toString("base64"),
          mimeType: uploadedFile.normalizedMimeType || uploadedFile.mimetype,
        }
      : parseImageDataPayload(payload);
    const hasUploadedImagePayload = Boolean(
      uploadedFile || imageInput || hasImageDataPayload(payload)
    );

    if (hasUploadedImagePayload) {
      logImageRequestDebug(req, payload);
    }

    if (!imageInput) {
      console.log("EARLY RETURN - Missing Image");
      return res.status(400).json({ message: "Image is required" });
    }

    const normalizedSelectedSubject = normalizeRequestSubject(effectiveSelectedSubject);

    if (!normalizedSelectedSubject) {
      return res.status(400).json(SUBJECT_REQUIRED_RESPONSE);
    }

    if (hasUploadedImagePayload && normalizedSelectedSubject === "Other Subjects") {
      console.log("EARLY RETURN - Other Subjects");
      return res.status(400).json({
        message: IMAGE_OTHER_SUBJECTS_UNSUPPORTED_MESSAGE,
      });
    }

    if (uploadedFile) {
      console.log("IMAGE_FILE_RECEIVED");
    }

    const requestQuestion = getFirstNonEmptyValue(
      payload.question,
      payload.query,
      payload.text,
      payload.message
    );

    const imageQuestionForSolver = buildImageSubjectGuardQuestion({
      question: requestQuestion,
      selectedSubject: normalizedSelectedSubject,
    });
    console.log(`SELECTED_SUBJECT = ${normalizedSelectedSubject || "Unknown"}`);
    console.log("Calling solveImageQuestionWithGemini...");
    const answer = await solveImageQuestionWithGemini({
      ...imageInput,
      question: imageQuestionForSolver,
    });
    if (isSubjectMismatchAnswer(answer)) {
      console.log("IMAGE_VALIDATION_RESULT = MISMATCH");
      console.log("EARLY RETURN - Subject Mismatch");
      return res.status(400).json(SUBJECT_MISMATCH_RESPONSE);
    }
    console.log("IMAGE_VALIDATION_RESULT = MATCH");
    console.log("Image Answer Generated");
    const finalAnswer =
      formatGeneratedAnswerText(formatImageAnswerForStudent(answer)) ||
      "I could not generate an answer from the image right now.";

    return res.json({
      question: requestQuestion || IMAGE_QUESTION_TEXT,
      answer: finalAnswer,
      sources: [],
      source_type: "gemini",
      filters_used: "image_gemini_solver",
    });
  } catch (err) {
    console.error("IMAGE_QUESTION_SOLVER_ERROR", err?.message || err);
    console.log("EARLY RETURN - OCR Failed");
    return res.status(500).json({
      message: "I could not solve the uploaded image right now. Please try again in a moment.",
    });
  }
});
