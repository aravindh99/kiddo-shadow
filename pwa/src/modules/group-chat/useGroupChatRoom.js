import { useEffect, useState, useRef } from "react";
import { getGroupChatMessages } from "./groupChat.api";
import {
  connectGroupChatSocket,
  disconnectGroupChatSocket,
} from "./groupChat.socket";
import { useAuth } from "../../auth/AuthProvider";

export function useGroupChatRoom(chatId) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    const socket = connectGroupChatSocket(token);
    socketRef.current = socket;

    socket.emit("group:join", { chatId });

    socket.on("group:message:new", (msg) => {
      const normalized = normalizeSocketMessage(msg, user);
      setMessages((prev) => addUnique(prev, normalized));
    });

    socket.on("group:error", () => {});

    return () => {
      socket.emit("group:leave", { chatId });
      socket.disconnect?.();
      disconnectGroupChatSocket();
      socketRef.current = null;
    };
  }, [chatId, token]);

  async function fetchMessages() {
    try {
      const res = await getGroupChatMessages(chatId);
      setMessages(ensureUnique((res.data || []).map((m) => normalizeApiMessage(m))));
    } catch {
      setMessages([]);
    }
  }

  function sendMessage(text) {
    const socket = socketRef.current || connectGroupChatSocket(token);
    socketRef.current = socket;

    socket.emit("group:message", {
      chatId,
      type: "text",
      text,
    });
  }

  return {
    messages,
    sendMessage,
  };
}

function normalizeApiMessage(m) {
  return {
    id: m.id,
    sender_id: m.sender_id,
    sender_name: m.sender_name || "Unknown",
    content: m.content,
    type: m.type,
    created_at: m.created_at || new Date().toISOString(),
  };
}

function addUnique(list, message) {
  if (!message?.id) return list;
  if (list.some((m) => m.id === message.id)) return list;
  return [...list, message];
}

function ensureUnique(list) {
  const seen = new Set();
  const out = [];
  for (const m of list) {
    if (!m?.id || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}

function normalizeSocketMessage(msg, user) {
  return {
    id: msg.id || `sock-${Date.now()}`,
    sender_id: msg.senderUserId,
    sender_name:
      msg.senderUserId === user?.id
        ? user?.name || "You"
        : msg.senderName || "Unknown",
    content: msg.text || msg.imageUrl || "",
    type: msg.type || "text",
    created_at: msg.createdAt || new Date().toISOString(),
  };
}
