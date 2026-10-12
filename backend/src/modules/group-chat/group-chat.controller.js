// src/modules/group-chat/group-chat.controller.js
import asyncHandler from "../../shared/asyncHandler.js";
import {
  createOrGetGroupChat,
  listGroupChatsForUser,
  deleteGroupChat,
  getGroupMessages,
} from "./group-chat.service.js";

export const createGroupChat = asyncHandler(async (req, res) => {
  const { subjectId, sectionId } = req.body;

  const result = await createOrGetGroupChat({
    user: req.user,
    subjectId,
    sectionId,
  });

  res.json(result);
});

export const listGroupChats = asyncHandler(async (req, res) => {
  const chats = await listGroupChatsForUser(req.user);
  res.json(chats);
});

export const deleteGroupChatController = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const result = await deleteGroupChat({ chatId, user: req.user });
  res.json(result);
});

export const getGroupMessagesController = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const messages = await getGroupMessages({ chatId, user: req.user });
  res.json(messages);
});
