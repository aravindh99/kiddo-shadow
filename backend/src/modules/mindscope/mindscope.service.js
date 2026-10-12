import { GoogleGenAI } from "@google/genai";
import AppError from "../../shared/appError.js";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const PRONOUNS = new Set(["i", "you", "he", "she", "it", "we", "they"]);
const AUXILIARIES = new Set([
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "shall",
  "can",
  "could",
  "may",
  "might",
  "must",
  "should",
  "would",
]);
const COMMON_VERBS = new Set([
  "go",
  "goes",
  "went",
  "gone",
  "play",
  "plays",
  "played",
  "playing",
  "study",
  "studies",
  "studied",
  "studying",
  "eat",
  "eats",
  "ate",
  "eaten",
  "eating",
  "read",
  "reads",
  "reading",
  "write",
  "writes",
  "wrote",
  "written",
  "writing",
  "run",
  "runs",
  "ran",
  "running",
  "walk",
  "walks",
  "walked",
  "walking",
  "come",
  "comes",
  "came",
  "coming",
  "make",
  "makes",
  "made",
  "making",
  "do",
  "does",
  "did",
  "done",
  "work",
  "works",
  "worked",
  "working",
  "sleep",
  "sleeps",
  "slept",
  "sleeping",
  "watch",
  "watches",
  "watched",
  "watching",
  "learn",
  "learns",
  "learned",
  "learning",
  "complete",
  "completes",
  "completed",
  "completing",
  "finish",
  "finishes",
  "finished",
  "finishing",
  "like",
  "likes",
  "liked",
  "liking",
  "love",
  "loves",
  "loved",
  "loving",
]);
const PLACE_PREPOSITIONS = new Set(["to", "in", "at", "on", "from", "into", "near", "inside", "outside"]);
const TIME_STARTERS = new Set([
  "today",
  "yesterday",
  "tomorrow",
  "daily",
  "now",
  "always",
  "usually",
  "often",
  "sometimes",
  "never",
]);

function preserveCase(source, replacement) {
  if (!source) return replacement;
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function cleanSentence(value = "") {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  const withoutExtraEnd = text.replace(/[.!?]+$/g, "");
  return `${withoutExtraEnd.charAt(0).toUpperCase()}${withoutExtraEnd.slice(1)}.`;
}

function singularPresentVerb(verb) {
  const lower = String(verb || "").toLowerCase();
  const irregular = {
    have: "has",
    do: "does",
    go: "goes",
  };
  if (irregular[lower]) return preserveCase(verb, irregular[lower]);
  if (/(s|x|z|ch|sh|o)$/i.test(lower)) return `${verb}es`;
  if (/[^aeiou]y$/i.test(lower)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

function basePresentVerb(verb) {
  const lower = String(verb || "").toLowerCase();
  const irregular = {
    has: "have",
    does: "do",
    goes: "go",
  };
  if (irregular[lower]) return preserveCase(verb, irregular[lower]);
  if (/ies$/i.test(verb)) return `${verb.slice(0, -3)}y`;
  if (/(ches|shes|sses|xes|zes|oes)$/i.test(verb)) return verb.slice(0, -2);
  if (/s$/i.test(verb) && !/ss$/i.test(verb)) return verb.slice(0, -1);
  return verb;
}

function applyGrammarCorrections(source) {
  let correctedText = cleanSentence(source);
  const issues = [];

  const addIssue = ({ type, original, suggestion, message }) => {
    issues.push({
      id: `${type}-${issues.length}`,
      type,
      original,
      suggestion,
      message,
    });
  };

  correctedText = correctedText.replace(/\bi\s+/g, (match) => {
    addIssue({
      type: "Capitalization",
      original: match.trim(),
      suggestion: "I",
      message: "Capitalize the pronoun I.",
    });
    return "I ";
  });

  const replacements = [
    {
      pattern: /\b(he|she|it)\s+are\b/gi,
      replacement: "$1 is",
      message: "Use is with he, she, or it.",
    },
    {
      pattern: /\b(he|she|it)\s+am\b/gi,
      replacement: "$1 is",
      message: "Use is with he, she, or it.",
    },
    {
      pattern: /\bi\s+is\b/gi,
      replacement: "I am",
      message: "Use am with I.",
    },
    {
      pattern: /\b(you|we|they)\s+is\b/gi,
      replacement: "$1 are",
      message: "Use are with you, we, or they.",
    },
    {
      pattern: /\b(he|she|it)\s+have\b/gi,
      replacement: "$1 has",
      message: "Use has with he, she, or it.",
    },
    {
      pattern: /\b(i|you|we|they)\s+has\b/gi,
      replacement: "$1 have",
      message: "Use have with I, you, we, or they.",
    },
  ];

  replacements.forEach((rule) => {
    correctedText = correctedText.replace(rule.pattern, (match, subject) => {
      const suggestion = rule.replacement.replace("$1", preserveCase(subject, subject.toLowerCase()));
      addIssue({
        type: "Grammar",
        original: match,
        suggestion,
        message: rule.message,
      });
      return suggestion;
    });
  });

  correctedText = correctedText.replace(
    /\b(he|she|it)\s+(go|play|study|eat|read|write|run|walk|come|make|do|work|sleep|watch|learn|complete|finish|like|love)\b/gi,
    (match, subject, verb) => {
      const suggestion = `${preserveCase(subject, subject.toLowerCase())} ${singularPresentVerb(verb.toLowerCase())}`;
      addIssue({
        type: "Subject-Verb Agreement",
        original: match,
        suggestion,
        message: `Use ${singularPresentVerb(verb.toLowerCase())} with ${subject.toLowerCase()} in simple present tense.`,
      });
      return suggestion;
    }
  );

  correctedText = correctedText.replace(
    /\b(i|you|we|they)\s+(goes|plays|studies|eats|reads|writes|runs|walks|comes|makes|does|works|sleeps|watches|learns|completes|finishes|likes|loves)\b/gi,
    (match, subject, verb) => {
      const suggestion = `${preserveCase(subject, subject.toLowerCase())} ${basePresentVerb(verb.toLowerCase())}`;
      addIssue({
        type: "Subject-Verb Agreement",
        original: match,
        suggestion,
        message: `Use ${basePresentVerb(verb.toLowerCase())} with ${subject.toLowerCase()} in simple present tense.`,
      });
      return suggestion;
    }
  );

  return {
    correctedText: cleanSentence(correctedText),
    issues,
  };
}

function wordsFromSentence(text = "") {
  return String(text || "")
    .replace(/[.!?]+$/g, "")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function detectTenseName(text = "") {
  const value = String(text || "").toLowerCase();
  if (/\b(will|shall)\s+\w+|\b(is|am|are)\s+going\s+to\b/.test(value)) return "Simple Future Tense";
  if (/\b(was|were)\s+\w+ing\b/.test(value)) return "Past Continuous Tense";
  if (/\b(am|is|are)\s+\w+ing\b/.test(value)) return "Present Continuous Tense";
  if (/\bhad\s+\w+(ed|en)\b|\bhad\s+(gone|done|eaten|written|made|seen|played|completed)\b/.test(value)) {
    return "Past Perfect Tense";
  }
  if (/\b(has|have)\s+\w+(ed|en)\b|\b(has|have)\s+(gone|done|eaten|written|made|seen|played|completed)\b/.test(value)) {
    return "Present Perfect Tense";
  }
  if (/\b(went|ate|ran|came|made|did|had|was|were|played|studied|walked|worked|watched|learned|completed|finished|liked|loved)\b/.test(value)) {
    return "Simple Past Tense";
  }
  return "Simple Present Tense";
}

function buildTenseExplanation(tenseName, correctedText, issues = []) {
  const explanations = {
    "Simple Present Tense": "This is Simple Present Tense. It tells a daily habit, regular action, or general fact.",
    "Simple Past Tense": "This is Simple Past Tense. It tells an action that already happened.",
    "Simple Future Tense": "This is Simple Future Tense. It tells an action that will happen later.",
    "Present Continuous Tense": "This is Present Continuous Tense. It tells an action happening now.",
    "Past Continuous Tense": "This is Past Continuous Tense. It tells an action that was happening in the past.",
    "Present Perfect Tense": "This is Present Perfect Tense. It connects a completed action with the present.",
    "Past Perfect Tense": "This is Past Perfect Tense. It tells an action completed before another past time.",
  };

  const tenseExplanation = explanations[tenseName] || `This sentence is in ${tenseName}.`;
  if (issues.length) {
    return `${tenseExplanation} ${issues.map((issue) => issue.message).join(" ")}`;
  }

  return tenseExplanation;
}

function isVerb(word = "") {
  const lower = word.toLowerCase();
  return (
    AUXILIARIES.has(lower) ||
    COMMON_VERBS.has(lower) ||
    /\w+(ed|ing)$/.test(lower) ||
    /\w+(ies|es|s)$/.test(lower)
  );
}

function findVerbIndex(words) {
  const firstVerbIndex = words.findIndex((word) => isVerb(word));
  return firstVerbIndex === -1 ? Math.min(1, words.length - 1) : firstVerbIndex;
}

function findTimeStartIndex(words) {
  const lowerWords = words.map((word) => word.toLowerCase());
  const everyIndex = lowerWords.findIndex((word, index) => word === "every" && lowerWords[index + 1]);
  if (everyIndex !== -1) return everyIndex;
  const nextIndex = lowerWords.findIndex((word, index) => word === "next" && lowerWords[index + 1]);
  if (nextIndex !== -1) return nextIndex;
  const lastIndex = lowerWords.findIndex((word, index) => word === "last" && lowerWords[index + 1]);
  if (lastIndex !== -1) return lastIndex;
  return lowerWords.findIndex((word) => TIME_STARTERS.has(word));
}

function formatChunk(words) {
  return words.join(" ").trim();
}

function buildSentenceStructure(text = "") {
  const words = wordsFromSentence(text);
  if (!words.length) return [];
  if (words.length === 1) return [{ text: words[0], role: "Sentence word" }];

  const verbIndex = findVerbIndex(words);
  const structure = [];
  const subjectWords = words.slice(0, verbIndex);
  const subject = formatChunk(subjectWords.length ? subjectWords : [words[0]]);
  const actualVerbIndex = subjectWords.length ? verbIndex : Math.min(1, words.length - 1);
  const firstVerb = words[actualVerbIndex];
  const secondVerb = words[actualVerbIndex + 1];

  if (subject) {
    structure.push({ text: subject, role: "Subject", note: "who or what the sentence is about" });
  }

  let cursor = actualVerbIndex + 1;
  const firstVerbLower = firstVerb?.toLowerCase();
  if (AUXILIARIES.has(firstVerbLower) && secondVerb && (isVerb(secondVerb) || /ing$|ed$|en$/i.test(secondVerb))) {
    structure.push({ text: firstVerb, role: "Helping verb" });
    structure.push({ text: secondVerb, role: "Action verb" });
    cursor = actualVerbIndex + 2;
  } else if (firstVerb) {
    structure.push({ text: firstVerb, role: "Verb/action", note: "what the subject does" });
  }

  const remaining = words.slice(cursor);
  if (!remaining.length) return structure;

  const timeStart = findTimeStartIndex(remaining);
  const beforeTime = timeStart === -1 ? remaining : remaining.slice(0, timeStart);
  const timeWords = timeStart === -1 ? [] : remaining.slice(timeStart);

  if (beforeTime.length) {
    const placeStart = beforeTime.findIndex((word) => PLACE_PREPOSITIONS.has(word.toLowerCase()));
    if (placeStart > 0) {
      structure.push({ text: formatChunk(beforeTime.slice(0, placeStart)), role: "Object", note: "receiver of the action" });
      structure.push({ text: formatChunk(beforeTime.slice(placeStart)), role: "Place", note: "where the action happens" });
    } else if (placeStart === 0) {
      structure.push({ text: formatChunk(beforeTime), role: "Object/place", note: "where the action goes or happens" });
    } else {
      structure.push({ text: formatChunk(beforeTime), role: "Object", note: "receiver of the action" });
    }
  }

  if (timeWords.length) {
    structure.push({ text: formatChunk(timeWords), role: "Time", note: "when or how often it happens" });
  }

  return structure;
}

function sanitizeGeminiPayload(payload, fallback) {
  if (!payload || typeof payload !== "object") return fallback;
  const structure = Array.isArray(payload.structure)
    ? payload.structure
        .map((item) => ({
          text: String(item?.text || "").trim(),
          role: String(item?.role || "").trim(),
          note: item?.note ? String(item.note).trim() : undefined,
        }))
        .filter((item) => item.text && item.role && !/sentence part|sentence starter/i.test(item.role))
    : [];

  return {
    correctedText: cleanSentence(payload.correctedText || fallback.correctedText),
    explanation: String(payload.explanation || fallback.explanation).trim(),
    issues: Array.isArray(payload.issues) ? payload.issues : fallback.issues,
    tenseName: String(payload.tenseName || fallback.tenseName).trim(),
    structure: structure.length ? structure : fallback.structure,
    score: Number.isFinite(Number(payload.score)) ? Number(payload.score) : fallback.score,
    source: "gemini",
  };
}

function extractJson(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const jsonText = fenced || raw.match(/\{[\s\S]*\}/)?.[0] || raw;
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

async function askGeminiGrammar(text, fallback) {
  if (!ai) return fallback;

  const prompt = `
You are a school grammar checker. Return ONLY valid JSON.
Input sentence: "${text}"

Required JSON shape:
{
  "correctedText": "correct sentence with punctuation",
  "tenseName": "tense name",
  "explanation": "First explain the tense, then explain any grammar correction in one or two simple sentences.",
  "issues": [{"id":"issue-0","type":"Grammar","original":"wrong text","suggestion":"correct text","message":"simple reason"}],
  "structure": [
    {"text":"subject words","role":"Subject","note":"who or what the sentence is about"},
    {"text":"verb words","role":"Verb/action","note":"what the subject does"},
    {"text":"object/place/time words","role":"Object / Place / Time","note":"simple explanation"}
  ],
  "score": 0-100
}

Rules:
- Never use generic roles like "Sentence part" or "Subject or sentence starter".
- Group words naturally: subject, helping verb, action verb, object, place, time.
- For "He play football", correctedText must be "He plays football." and structure must include He=Subject, plays=Verb/action, football=Object.
- For "She go to school every day", correctedText must be "She goes to school every day." and structure must include She=Subject, goes=Verb/action, to school=Object/place, every day=Time.
`;

  try {
    const result = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
    const parsed = extractJson(result?.text || result?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "");
    return sanitizeGeminiPayload(parsed, fallback);
  } catch (error) {
    console.error("MindScope Gemini grammar failed:", error?.message || error);
    return fallback;
  }
}

function buildMeaningFallback(word) {
  return {
    word,
    englishMeaning: "Could not explain this word right now. Please try again.",
    tamilMeaning: "இந்த வார்த்தையை இப்போது விளக்க முடியவில்லை. மீண்டும் முயற்சி செய்யவும்.",
    englishExample: "",
    tamilExample: "",
    relatedWords: [],
    source: "local",
  };
}

function sanitizeMeaningPayload(payload, fallback) {
  if (!payload || typeof payload !== "object") return fallback;

  const relatedWords = Array.isArray(payload.relatedWords)
    ? payload.relatedWords
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return {
    word: String(payload.word || fallback.word).trim(),
    englishMeaning: String(payload.englishMeaning || fallback.englishMeaning).trim(),
    tamilMeaning: String(payload.tamilMeaning || fallback.tamilMeaning).trim(),
    englishExample: String(payload.englishExample || "").trim(),
    tamilExample: String(payload.tamilExample || "").trim(),
    relatedWords,
    source: "gemini",
  };
}

async function askGeminiMeaning(word, fallback) {
  if (!ai) return fallback;

  const prompt = `
You are MindScope, a bilingual school dictionary for students.
Explain this word in simple English and Tamil: "${word}"

Return ONLY valid JSON in this exact shape:
{
  "word": "${word}",
  "englishMeaning": "simple English meaning in one or two sentences",
  "tamilMeaning": "clear Tamil meaning in one or two sentences",
  "englishExample": "one simple English example sentence using the word",
  "tamilExample": "one simple Tamil example sentence using the meaning",
  "relatedWords": ["3 to 6 simple related English words"]
}

Rules:
- Do not include markdown.
- Do not include transliteration unless it helps the meaning.
- Use age-friendly language.
- If the input is misspelled, infer the likely word and explain that word.
`;

  try {
    const result = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
    const text =
      result?.text ||
      result?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") ||
      "";
    return sanitizeMeaningPayload(extractJson(text), fallback);
  } catch (error) {
    console.error("MindScope Gemini meaning failed:", error?.message || error);
    return fallback;
  }
}

export async function checkMindScopeGrammar({ text }) {
  const source = String(text || "").trim();
  if (!source) throw new AppError("text is required", 400);
  if (source.length > 1000) throw new AppError("text must be 1000 characters or less", 400);

  const correction = applyGrammarCorrections(source);
  const tenseName = detectTenseName(correction.correctedText);
  const fallback = {
    correctedText: correction.correctedText,
    tenseName,
    explanation: buildTenseExplanation(tenseName, correction.correctedText, correction.issues),
    issues: correction.issues,
    structure: buildSentenceStructure(correction.correctedText),
    score: Math.max(40, 100 - correction.issues.length * 10),
    source: "local",
  };

  return askGeminiGrammar(source, fallback);
}

export async function explainMindScopeMeaning({ word }) {
  const value = String(word || "").trim();
  if (!value) throw new AppError("word is required", 400);
  if (value.length > 80) throw new AppError("word must be 80 characters or less", 400);

  return askGeminiMeaning(value, buildMeaningFallback(value));
}
