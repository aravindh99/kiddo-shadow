import { useEffect, useMemo, useState } from "react";

export function useVoiceChatHistory({ classLevel, userId }) {
  const historyKey = useMemo(
    () => `voice_chat_conversations_${userId || "guest"}_${classLevel || "general"}`,
    [userId, classLevel]
  );

  const [conversations, setConversations] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setConversations(Array.isArray(parsed) ? parsed : []);
    } catch {
      setConversations([]);
    }
  }, [historyKey]);

  function persistConversations(next) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(historyKey, JSON.stringify(next.slice(0, 50)));
    } catch {
      // Ignore storage failures.
    }
  }

  function getConversationTitle(nextMessages) {
    const firstUser = nextMessages.find(
      (message) => message?.role === "user" && typeof message?.text === "string"
    );
    const raw = (firstUser?.text || "New Voice Chat").trim();
    return raw.length > 60 ? `${raw.slice(0, 57).trim()}...` : raw;
  }

  function saveConversation(nextMessages) {
    const now = new Date().toISOString();
    const conversationId =
      activeConversationId || `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      id: conversationId,
      title: getConversationTitle(nextMessages),
      updatedAt: now,
      createdAt: now,
      messages: nextMessages.slice(-200),
    };

    setConversations((prev) => {
      const index = prev.findIndex((conversation) => conversation.id === conversationId);
      let next = prev;

      if (index >= 0) {
        const existing = prev[index];
        const updated = {
          ...existing,
          ...payload,
          createdAt: existing.createdAt || payload.createdAt,
        };
        next = [...prev];
        next[index] = updated;
      } else {
        next = [payload, ...prev];
      }

      next.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
      persistConversations(next);
      return next;
    });

    if (!activeConversationId) {
      setActiveConversationId(conversationId);
    }
  }

  function appendMessage(message) {
    setMessages((prev) => {
      const next = [...prev, message];
      saveConversation(next);
      return next;
    });
  }

  return {
    messages,
    conversations,
    activeConversationId,
    appendMessage,
    startNewChat: () => {
      setMessages([]);
      setActiveConversationId(null);
    },
    loadConversation: (conversationId) => {
      const found = conversations.find((conversation) => conversation.id === conversationId);
      if (!found) return;
      setMessages(Array.isArray(found.messages) ? found.messages : []);
      setActiveConversationId(found.id);
    },
  };
}
