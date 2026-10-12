import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  askAiImageQuestion,
  askAiQuestion,
  generateRagAnswerMode,
  getAiChatConversation,
  listAiChatConversations,
  syncAiChatConversations,
  upsertAiChatConversation,
} from "../api/aiChat.api";

export function useAiChat({ classLevel, userId }) {
  const historyKey = useMemo(
    () => `ai_chat_conversations_${userId || "guest"}_${classLevel || "general"}`,
    [userId, classLevel]
  );
  const activeConversationKey = useMemo(
    () => `${historyKey}_active`,
    [historyKey]
  );
  const syncInFlightRef = useRef(new Map());

  const createId = useCallback(
    (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    []
  );

  const normalizeMessage = useCallback(
    (message, index = 0, conversationId = "conv") => {
      const timestamp = message?.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString();
      return {
        id: message?.id || `${conversationId}_msg_${index}_${new Date(timestamp).getTime()}`,
        role: ["user", "ai", "system"].includes(message?.role) ? message.role : "user",
        text: String(message?.text || ""),
        imageName: message?.imageName || message?.image_name || null,
        imagePreviewUrl: message?.imagePreviewUrl || message?.image_preview_url || null,
        metadata: message?.metadata || null,
        timestamp,
      };
    },
    []
  );

  const normalizeConversation = useCallback(
    (conversation, index = 0) => {
      const id = conversation?.id || createId(`conv_${index}`);
      const messages = Array.isArray(conversation?.messages)
        ? conversation.messages.map((message, messageIndex) =>
            normalizeMessage(message, messageIndex, id)
          )
        : [];
      const title = String(conversation?.title || messages.find((message) => message.role === "user")?.text || "New Chat").trim();
      return {
        id,
        title: title.length > 60 ? `${title.slice(0, 57)}...` : title,
        updatedAt:
          conversation?.updatedAt ||
          conversation?.lastSyncedAt ||
          messages[messages.length - 1]?.timestamp ||
          conversation?.createdAt ||
          new Date().toISOString(),
        createdAt: conversation?.createdAt || messages[0]?.timestamp || new Date().toISOString(),
        deletedAt: conversation?.deletedAt || null,
        previewText:
          conversation?.previewText ||
          [...messages].reverse().find((message) => message?.text)?.text ||
          "",
        classLevel: conversation?.classLevel || classLevel || "general",
        messageCount: Number(conversation?.messageCount || messages.length || 0),
        messages,
        metadata: conversation?.metadata || null,
      };
    },
    [classLevel, createId, normalizeMessage]
  );

  const sortConversations = useCallback(
    (items) =>
      [...items].sort(
        (left, right) =>
          new Date(right.updatedAt || right.createdAt).getTime() -
          new Date(left.updatedAt || left.createdAt).getTime()
      ),
    []
  );

  const getCandidateHistoryKeys = useCallback(() => {
    if (typeof window === "undefined") return [historyKey];

    const keys = new Set([historyKey]);
    const prefix = "ai_chat_conversations_";

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(prefix) || key.endsWith("_active")) continue;
      keys.add(key);
    }

    return [...keys];
  }, [historyKey]);

  const readLocalConversations = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const merged = [];

      getCandidateHistoryKeys().forEach((key) => {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return;
        parsed.forEach((conversation, index) => {
          merged.push(normalizeConversation(conversation, index));
        });
      });

      const deduped = new Map();
      merged.forEach((conversation) => {
        const existing = deduped.get(conversation.id);
        if (!existing) {
          deduped.set(conversation.id, conversation);
          return;
        }

        const existingUpdated = new Date(existing.updatedAt || existing.createdAt).getTime();
        const nextUpdated = new Date(conversation.updatedAt || conversation.createdAt).getTime();
        if (nextUpdated >= existingUpdated) {
          deduped.set(conversation.id, {
            ...existing,
            ...conversation,
            messages: conversation.messages?.length ? conversation.messages : existing.messages,
          });
        }
      });

      return sortConversations([...deduped.values()]);
    } catch {
      return [];
    }
  }, [getCandidateHistoryKeys, normalizeConversation, sortConversations]);

  const [conversations, setConversations] = useState(() => {
    return readLocalConversations();
  });
  const [messages, setMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(activeConversationKey) || null;
  });
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);

  const persistConversations = useCallback(
    (next) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(historyKey, JSON.stringify(next.slice(0, 200)));
      } catch {
        // Ignore cache failures.
      }
    },
    [historyKey]
  );

  const persistActiveConversation = useCallback(
    (conversationId) => {
      if (typeof window === "undefined") return;
      if (conversationId) {
        localStorage.setItem(activeConversationKey, conversationId);
      } else {
        localStorage.removeItem(activeConversationKey);
      }
    },
    [activeConversationKey]
  );

  const mergeConversations = useCallback(
    (incomingItems, { replace = false } = {}) => {
      setConversations((prev) => {
        if (replace && (!Array.isArray(incomingItems) || incomingItems.length === 0)) {
          return prev;
        }

        const baseMap = new Map();
        const seed = replace ? [] : prev;
        seed.forEach((conversation, index) => {
          const normalized = normalizeConversation(conversation, index);
          baseMap.set(normalized.id, normalized);
        });
        incomingItems.forEach((conversation, index) => {
          const normalized = normalizeConversation(conversation, index);
          const existing = baseMap.get(normalized.id);
          if (!existing) {
            baseMap.set(normalized.id, normalized);
            return;
          }
          const existingMessages = Array.isArray(existing.messages) ? existing.messages : [];
          const nextMessages = Array.isArray(normalized.messages) && normalized.messages.length
            ? normalized.messages
            : existingMessages;
          baseMap.set(normalized.id, {
            ...existing,
            ...normalized,
            messages: nextMessages,
            messageCount: Math.max(
              Number(existing.messageCount || existingMessages.length || 0),
              Number(normalized.messageCount || nextMessages.length || 0)
            ),
            previewText: normalized.previewText || existing.previewText || "",
          });
        });
        const next = sortConversations([...baseMap.values()]);
        persistConversations(next);
        return next;
      });
    },
    [normalizeConversation, persistConversations, sortConversations]
  );

  useEffect(() => {
    setConversations(readLocalConversations());
  }, [readLocalConversations]);

  function getConversationTitle(msgs) {
    const firstUser = msgs.find((m) => m.role === "user" && typeof m.text === "string");
    const raw = (firstUser?.text || "New Chat").trim();
    return raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
  }

  const pushConversationToServer = useCallback(
    async (snapshot) => {
      if (!userId) return;
      const serialized = JSON.stringify(snapshot);
      if (syncInFlightRef.current.get(snapshot.id) === serialized) return;
      syncInFlightRef.current.set(snapshot.id, serialized);
      try {
        const response = await upsertAiChatConversation(snapshot);
        const saved = response?.data || response;
        if (saved) {
          mergeConversations([saved]);
        }
      } catch {
        // Keep offline/local state intact.
      } finally {
        syncInFlightRef.current.delete(snapshot.id);
      }
    },
    [mergeConversations, userId]
  );

  function saveConversation(nextMessages) {
    const now = new Date().toISOString();
    const convId =
      activeConversationId || createId("conv");

    const normalizedMessages = nextMessages.map((message, index) =>
      normalizeMessage(message, index, convId)
    );

    const payload = {
      id: convId,
      title: getConversationTitle(normalizedMessages),
      updatedAt: now,
      createdAt:
        conversations.find((conversation) => conversation.id === convId)?.createdAt || now,
      previewText: [...normalizedMessages].reverse().find((message) => message?.text)?.text || "",
      classLevel: classLevel || "general",
      messageCount: normalizedMessages.length,
      messages: normalizedMessages.slice(-500),
    };
    mergeConversations([payload]);
    if (activeConversationId !== convId) {
      setActiveConversationId(convId);
      persistActiveConversation(convId);
    }
    void pushConversationToServer(payload);
    return payload;
  }

  const refreshConversationList = useCallback(
    async ({ search = "", offset = 0, append = false } = {}) => {
      if (!userId) return;
      setHistoryLoading(true);
      try {
        const requestParams = {
          classLevel,
          search: search || undefined,
          offset,
          limit: 25,
        };
        let response = await listAiChatConversations(requestParams);
        let data = response?.data || response;
        let items = Array.isArray(data?.items) ? data.items : [];

        if (!append && !search && offset === 0 && items.length === 0 && classLevel) {
          response = await listAiChatConversations({
            search: undefined,
            offset: 0,
            limit: 25,
          });
          data = response?.data || response;
          items = Array.isArray(data?.items) ? data.items : [];
        }

        mergeConversations(items, { replace: !append && !search && items.length > 0 });
        setHistoryOffset(offset + items.length);
        setHistoryHasMore(Boolean(data?.hasMore));
      } catch {
        // Keep local cache.
      } finally {
        setHistoryLoading(false);
      }
    },
    [classLevel, mergeConversations, userId]
  );

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      persistActiveConversation(null);
      return;
    }

    const cached = conversations.find((conversation) => conversation.id === activeConversationId);
    if (cached?.messages?.length) {
      setMessages(cached.messages);
    }
    persistActiveConversation(activeConversationId);
  }, [activeConversationId, conversations, persistActiveConversation]);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
      if (ignore) return;
      await refreshConversationList({ search: historyQuery, offset: 0, append: false });
    }, historyQuery ? 240 : 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [historyQuery, refreshConversationList]);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      if (!userId) return;
      const localConversations = readLocalConversations();
      if (localConversations.length) {
        try {
          await syncAiChatConversations(localConversations);
        } catch {
          // Local fallback remains available offline.
        }
      }
      if (!ignore) {
        await refreshConversationList({ search: "", offset: 0, append: false });
      }
    }

    void bootstrap();
    return () => {
      ignore = true;
    };
  }, [readLocalConversations, refreshConversationList, userId]);

  useEffect(() => {
    function handleReconnect() {
      void refreshConversationList({ search: historyQuery, offset: 0, append: false });
    }
    window.addEventListener("online", handleReconnect);
    window.addEventListener("focus", handleReconnect);
    return () => {
      window.removeEventListener("online", handleReconnect);
      window.removeEventListener("focus", handleReconnect);
    };
  }, [historyQuery, refreshConversationList]);

  async function sendMessage(text, preferredLanguage = null, sendOptions = {}) {
    const options =
      preferredLanguage && typeof preferredLanguage === "object"
        ? preferredLanguage
        : sendOptions;
    const language =
      preferredLanguage && typeof preferredLanguage === "string"
        ? preferredLanguage
        : null;
    const selectedImage = options?.image || null;
    const subject = options?.subject ?? null;
    const isOtherSubjectsRagRequest =
      !selectedImage &&
      String(subject || "").trim().toLowerCase() === "other subjects";

    const userMsg = {
      id: createId("msg"),
      role: "user",
      text,
      imagePreviewUrl: options?.imagePreviewUrl,
      imageName: options?.imageName || null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = [...prev, userMsg];
      // Persist immediately so no message is lost even if app closes before AI reply.
      saveConversation(next);
      return next;
    });
    setLoading(true);

    try {
      const res = selectedImage
        ? await askAiImageQuestion({
            image: selectedImage,
            question: text,
            subject,
          })
        : await askAiQuestion(
            {
              question: text,
              subject,
              classLevel,
              language: language || undefined,
              preferredLanguage: language || undefined,
              lang: language || undefined,
            },
            language || undefined
          );

      const answerText =
        res?.data?.answer ??
        res?.answer ??
        res?.data?.message ??
        "AI assistant is temporarily unavailable. Please try again.";
      const responseMetadata =
        res?.data?.metadata && typeof res.data.metadata === "object"
          ? res.data.metadata
          : res?.metadata && typeof res.metadata === "object"
          ? res.metadata
          : {};

      const aiMsg = {
        id: createId("msg"),
        role: "ai",
        text: String(answerText),
        metadata: isOtherSubjectsRagRequest
          ? {
              ...responseMetadata,
              ragAnswerControls: true,
              originalQuestion: text,
              subject,
            }
          : responseMetadata,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const next = [...prev, aiMsg];
        saveConversation(next);
        return next;
      });

      return aiMsg.text; // IMPORTANT: for voice mode
    } catch (error) {
      const isUnauthorized = error?.response?.status === 401;
      const backendErrorData = error?.response?.data;
      const backendMessage =
        (typeof backendErrorData === "string" ? backendErrorData : "") ||
        backendErrorData?.message ||
        backendErrorData?.error ||
        backendErrorData?.detail ||
        backendErrorData?.data?.message ||
        "";
      const isSubjectMismatchError =
        typeof backendMessage === "string" &&
        backendMessage.toLowerCase().includes("selected subject");
      const fallbackText =
        isSubjectMismatchError
          ? backendMessage
          : isUnauthorized
          ? "Session required for AI. Please login again and retry."
          : selectedImage
          ? "Unable to read the uploaded image right now. Please try again."
          : "AI assistant is temporarily unavailable. Please try again.";

      const aiMsg = {
        id: createId("msg"),
        role: "ai",
        text: fallbackText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const next = [...prev, aiMsg];
        saveConversation(next);
        return next;
      });
      return aiMsg.text;
    } finally {
      setLoading(false);
    }
  }

  function appendRagAnswerForMessage({ answerText, mode }) {
    const aiMsg = {
      id: createId("msg"),
      role: "ai",
      text: String(answerText),
      metadata: {
        ragAnswerMode: mode,
      },
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = [...prev, aiMsg];
      saveConversation(next);
      return next;
    });

    return aiMsg.text;
  }

  async function generateRagAnswerForMessage({ question, answer, mode }) {
    const res = await generateRagAnswerMode({ question, answer, mode });
    const answerText =
      (typeof res?.data === "string" && res.data.trim() ? res.data : null) ??
      res?.data?.answer ??
      res?.answer ??
      res?.data?.message ??
      res?.message ??
      "AI assistant is temporarily unavailable. Please try again.";

    return appendRagAnswerForMessage({ answerText, mode });
  }

  return {
    messages,
    conversations,
    activeConversationId,
    loading,
    historyLoading,
    historyHasMore,
    historyQuery,
    sendMessage,
    generateRagAnswerForMessage,
    appendRagAnswerForMessage,
    startNewChat: () => {
      setMessages([]);
      setActiveConversationId(null);
      persistActiveConversation(null);
    },
    loadConversation: async (conversationId) => {
      const found = conversations.find((c) => c.id === conversationId);
      if (found?.messages?.length) {
        setMessages(found.messages);
      } else {
        setMessages([]);
      }
      setActiveConversationId(conversationId);
      if (!userId) return;
      try {
        const response = await getAiChatConversation(conversationId);
        const data = response?.data || response;
        if (data) {
          mergeConversations([data]);
          setMessages(Array.isArray(data.messages) ? data.messages : []);
        }
      } catch {
        // Keep cached conversation if available.
      }
    },
    loadMoreConversations: async () => {
      if (!historyHasMore || historyLoading) return;
      await refreshConversationList({
        search: historyQuery,
        offset: historyOffset,
        append: true,
      });
    },
    setHistoryQuery,
  };
}
