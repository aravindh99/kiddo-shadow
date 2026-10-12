import asyncHandler from "../../shared/asyncHandler.js";
import {
  generateAiChatFollowup,
  getAiChatConversation,
  getAiChatMessages,
  listAiChatConversations,
  restoreAiChatConversation,
  softDeleteAiChatConversation,
  syncAiChatConversations,
  upsertAiChatConversation,
} from "./ai-chat.service.js";

export const listConversationsController = asyncHandler(async (req, res) => {
  const result = await listAiChatConversations({
    user: req.user,
    classLevel: req.query.classLevel,
    search: req.query.search,
    limit: Number(req.query.limit || 20),
    offset: Number(req.query.offset || 0),
    includeDeleted: req.query.includeDeleted === "true",
  });

  res.json(result);
});

export const getConversationController = asyncHandler(async (req, res) => {
  const conversation = await getAiChatConversation({
    user: req.user,
    conversationId: req.params.conversationId,
  });
  res.json(conversation);
});

export const getConversationMessagesController = asyncHandler(async (req, res) => {
  const result = await getAiChatMessages({
    user: req.user,
    conversationId: req.params.conversationId,
    limit: Number(req.query.limit || 100),
    offset: Number(req.query.offset || 0),
  });
  res.json(result);
});

export const syncConversationsController = asyncHandler(async (req, res) => {
  const synced = await syncAiChatConversations({
    user: req.user,
    conversations: Array.isArray(req.body?.conversations) ? req.body.conversations : [],
  });
  res.json({ items: synced });
});

export const upsertConversationController = asyncHandler(async (req, res) => {
  const saved = await upsertAiChatConversation({
    user: req.user,
    conversation: req.body,
  });
  res.json(saved);
});

export const deleteConversationController = asyncHandler(async (req, res) => {
  const result = await softDeleteAiChatConversation({
    user: req.user,
    conversationId: req.params.conversationId,
  });
  res.json(result);
});

export const restoreConversationController = asyncHandler(async (req, res) => {
  const restored = await restoreAiChatConversation({
    user: req.user,
    conversationId: req.params.conversationId,
  });
  res.json(restored);
});

export const createFollowupController = asyncHandler(async (req, res) => {
  const result = await generateAiChatFollowup({
    originalQuestion: req.body?.originalQuestion,
    previousAnswer: req.body?.previousAnswer,
    followupType: req.body?.followupType,
  });

  res.json(result);
});
