import VoiceLog from "./voice-log.model.js";
import { askRag } from "../rag/rag.service.js";
import { textToSpeech } from "../../shared/services/voice.service.js";

const NOT_PROVIDED = "It is not provided in the book.";

/* ============================================
   🔊 MAIN VOICE CHAT SERVICE
============================================ */
export const processVoiceChat = async ({
  question,
  purpose = "general",
  userId,
  classLevel = null,
}) => {
  if (!question) {
    throw new Error("Question is required");
  }

  // 1️⃣ Call existing RAG service (NO CHANGES TO RAG FILE)
  const ragResult = await askRag({
    question,
    classLevel,
    userId,
  });

  const hasGeminiSolverMarker = (value) => {
    const marker = String(value || "").toLowerCase();
    return marker.includes("gemini") || marker.includes("solver");
  };
  const answerText = ragResult.answer;
  const source_type = ragResult.source_type;
  const source = ragResult.source;
  const answer_source = ragResult.answer_source;
  const filters_used = ragResult.filters_used;
  const metadata_source_type = ragResult.metadata?.source_type;
  const hasSourceMarker =
    hasGeminiSolverMarker(source_type) ||
    hasGeminiSolverMarker(source) ||
    hasGeminiSolverMarker(answer_source) ||
    hasGeminiSolverMarker(filters_used) ||
    hasGeminiSolverMarker(metadata_source_type);
  const sources = Array.isArray(ragResult.sources) ? ragResult.sources : [];
  const documents = Array.isArray(ragResult.documents) ? ragResult.documents : [];
  const chunks = Array.isArray(ragResult.chunks) ? ragResult.chunks : [];
  const context = Array.isArray(ragResult.context) ? ragResult.context : [];
  const hasAnswer =
    typeof answerText === "string" && answerText.trim().length > 0;
  const isRagSource =
    source_type === "rag" ||
    source === "rag" ||
    answer_source === "rag" ||
    metadata_source_type === "rag";
  const hasSources =
    sources.length > 0 ||
    documents.length > 0 ||
    chunks.length > 0 ||
    context.length > 0;
  const normalizedAnswer = String(answerText || "").trim().toLowerCase();
  const isFallback =
    !hasAnswer ||
    /not provided in the book|not found|no relevant|outside.*book|not available/i.test(
      String(answerText || "")
    ) ||
    normalizedAnswer === "i don't know based on the provided books.";
  const isNumericalQuestion =
    /\b(solve|calculate|find\s+the\s+value|equation|simplify|polynomial|zeroes|factor|divide|fraction|sin|cos|tan|derivative|integral)\b/i.test(
      question
    ) ||
    /[+\-*/=<>]/.test(String(question || "")) ||
    /\bx(?:²|\^2)\b/i.test(String(question || ""));
  const willReturnNotProvided =
    !isRagSource ||
    !hasSources ||
    isFallback ||
    hasSourceMarker;

  console.log("VOICE_RAG_VALIDATION", {
    source_type,
    source,
    answer_source,
    hasAnswer,
    hasSources,
    isFallback,
    willReturnNotProvided
  });

  if (willReturnNotProvided) {
    return {
      answer: NOT_PROVIDED,
      audioBuffer: null,
      textOnly: true,
      notFoundInBook: true,
    };
  }

  if (!answerText) {
    throw new Error("Failed to generate answer");
  }

  const shouldGenerateVoice =
    isRagSource &&
    hasSources &&
    !isFallback &&
    !hasSourceMarker &&
    !isNumericalQuestion;

  console.log("VOICE_CHAT_DECISION", {
    question,
    source_type,
    source,
    answer_source,
    filters_used,
    metadata_source_type,
    isNumericalQuestion,
    shouldGenerateVoice
  });

  if (!shouldGenerateVoice) {
    return {
      answer: answerText,
      audioBuffer: null,
      textOnly: true,
    };
  }

  // 2️⃣ Send Answer Text to NeMo TTS
  const audioBuffer = await textToSpeech(answerText);

  // 3️⃣ Save Voice Log
  if (userId) {
    await VoiceLog.create({
      user_id: userId,
      purpose,
      text: answerText,
      tokens_used: ragResult.tokens_used || 0,
    });
  }

  // 4️⃣ Return Audio Buffer
  return {
    answer: answerText,
    audioBuffer,
  };
};

/* ============================================
   📜 GET USER VOICE LOGS
============================================ */
export const getUserVoiceLogs = async (userId) => {
  return await VoiceLog.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
};
