import api from "../../../api/axios";

export function askAiQuestion(payload, language) {
  return api.post(
    "/rag/ask",
    {
      question: payload?.question,
      subject: payload?.subject ?? null,
      classLevel: payload?.classLevel,
      language: language || payload?.language,
      preferredLanguage: payload?.preferredLanguage,
      lang: payload?.lang,
    },
    {
      headers: language
        ? {
            "X-Chat-Language": String(language),
          }
        : undefined,
    }
  );
}

export function askAiImageQuestion({ image, question, subject }) {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("question", question);
  if (subject) formData.append("subject", subject);

  return api.post("/rag/image-question", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function generateRagAnswerMode(payload) {
  return api.post(
    "/rag-explanation",
    {
      question: payload?.question,
      answer: payload?.answer,
      mode: payload?.mode,
    },
    payload?.mode === "detail" ? { timeout: 60000 } : undefined
  );
}

export function listAiChatConversations(params = {}) {
  return api.get("/ai-chat/conversations", { params });
}

export function getAiChatConversation(conversationId) {
  return api.get(`/ai-chat/conversations/${conversationId}`);
}

export function getAiChatMessages(conversationId, params = {}) {
  return api.get(`/ai-chat/conversations/${conversationId}/messages`, { params });
}

export function syncAiChatConversations(conversations = []) {
  return api.post("/ai-chat/conversations/sync", { conversations });
}

export function upsertAiChatConversation(conversation) {
  return api.post("/ai-chat/conversations", conversation);
}

export function deleteAiChatConversation(conversationId) {
  return api.delete(`/ai-chat/conversations/${conversationId}`);
}

export function restoreAiChatConversation(conversationId) {
  return api.post(`/ai-chat/conversations/${conversationId}/restore`);
}
