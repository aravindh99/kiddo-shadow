import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(
  /^models\//,
  ""
);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const MODE_RULES = Object.freeze({
  short: {
    instruction: [
      "Simplify this answer for a 6th standard student.",
      "Return 3 to 5 complete sentences.",
      "Explain the topic directly.",
      "Keep the main meaning.",
      "Use simple words.",
      'Do not explain what "the question" asks.',
      'Do not mention "the question".',
    ],
  },
  detail: {
    instruction: [
      "Expand this answer into a detailed explanation based on the given content.",
      "Explain the topic, not the question.",
      "Generate 10 to 15 structured points.",
      "Add deeper explanation about the topic.",
      "Explain important concepts clearly.",
      "Use simple language suitable for a 6th standard student.",
      "Add useful context only when it is educationally relevant.",
      "Maintain factual accuracy.",
      "Organize with headings and numbered points.",
      "Make the student understand the topic completely.",
    ],
  },
});

export const normalizePostRagExplanationMode = (mode) => {
  const normalizedMode = String(mode || "").trim().toLowerCase();
  if (normalizedMode === "brief") return "detail";
  if (normalizedMode === "details" || normalizedMode === "detailed") return "detail";
  return MODE_RULES[normalizedMode] ? normalizedMode : null;
};

export const buildPostRagExplanationPrompt = ({
  question,
  originalQuestion,
  answer,
  mode,
}) => {
  const normalizedMode = normalizePostRagExplanationMode(mode);
  const rules = MODE_RULES[normalizedMode];
  const cleanedQuestion = String(question || originalQuestion || "").trim();
  const cleanedAnswer = String(answer || "").trim();

  if (!rules) {
    throw new Error("Invalid explanation mode.");
  }

  return [
    "You are transforming an already generated RAG answer for a student.",
    "Use the existing RAG answer as the source content.",
    "Do not answer the question again from your own knowledge.",
    "Do not explain what the question means.",
    'Do not write phrases like "this question asks" or "the question is asking".',
    "Never introduce unrelated facts.",
    "Never hallucinate.",
    "Never change the topic.",
    "Only transform, simplify, or expand the given answer.",
    "",
    "Safety rules:",
    "The existing answer is the source of truth.",
    "If the answer is short, expand only what is directly supported by it.",
    "If useful context is added, keep it clearly related and educational.",
    "Never generate content outside the topic of the given answer.",
    "",
    `Mode: ${normalizedMode}`,
    ...rules.instruction,
    "No markdown tables.",
    "No markdown formatting.",
    "No code blocks.",
    "No unrelated information.",
    "Return plain text only.",
    "",
    "Question:",
    cleanedQuestion,
    "",
    "Existing RAG answer:",
    cleanedAnswer,
  ].join("\n");
};

const sanitizePlainText = (value) =>
  String(value || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const extractGeminiText = (result) => {
  const text = typeof result?.text === "function" ? result.text() : result?.text;
  return (
    text ||
    result?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") ||
    ""
  );
};

export const logPostRagExplanationError = (label, err) => {
  console.error(label, {
    message: err?.message || String(err),
    stack: err?.stack,
    geminiResponse:
      err?.response?.data ||
      err?.response ||
      err?.errorDetails ||
      err?.details ||
      err?.cause?.response?.data ||
      err?.cause?.response ||
      null,
  });
};

export const generatePostRagExplanation = async ({
  question,
  originalQuestion,
  answer,
  mode,
}) => {
  try {
    const cleanedQuestion = String(question || originalQuestion || "").trim();
    const cleanedAnswer = String(answer || "").trim();
    const normalizedMode = normalizePostRagExplanationMode(mode);

    console.log("POST_RAG_EXPLANATION_SERVICE_INPUT", {
      hasQuestion: Boolean(cleanedQuestion),
      hasAnswer: Boolean(cleanedAnswer),
      questionLength: cleanedQuestion.length,
      answerLength: cleanedAnswer.length,
      rawMode: mode,
      normalizedMode,
      geminiModel: GEMINI_MODEL,
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    });

    if (!cleanedQuestion) {
      const err = new Error("question is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!cleanedAnswer) {
      const err = new Error("answer is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!normalizedMode) {
      const err = new Error("mode must be short or detail.");
      err.statusCode = 400;
      throw err;
    }

    if (!ai) {
      const err = new Error("Explanation generator is unavailable.");
      err.statusCode = 503;
      throw err;
    }

    console.log("POST_RAG_EXPLANATION_GEMINI_CALL_START", {
      mode: normalizedMode,
      questionLength: cleanedQuestion.length,
      answerLength: cleanedAnswer.length,
    });

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPostRagExplanationPrompt({
        question: cleanedQuestion,
        answer: cleanedAnswer,
        mode: normalizedMode,
      }),
    });

    const explanation = sanitizePlainText(extractGeminiText(result));

    console.log("POST_RAG_EXPLANATION_GEMINI_CALL_SUCCESS", {
      mode: normalizedMode,
      explanationLength: explanation.length,
      hasExplanation: Boolean(explanation),
    });

    return explanation;
  } catch (err) {
    logPostRagExplanationError("POST_RAG_EXPLANATION_SERVICE_ERROR", err);
    throw err;
  }
};
