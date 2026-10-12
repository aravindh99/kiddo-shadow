import api from "../../api/axios";

/**
 * List group chats for logged-in user
 */
export const getMyGroupChats = () =>
  api.get("/group-chat");

/**
 * Create a new group chat
 * @param {Object} data - { subjectId, sectionId }
 */
export const createGroupChat = (data) =>
  api.post("/group-chat", data);

/**
 * Fetch messages for a group (history)
 */
export const getGroupChatMessages = (groupId) =>
  api.get(`/group-chat/${groupId}/messages`);

/**
 * Delete a group chat
 */
export const deleteGroupChat = (groupId) =>
  api.delete(`/group-chat/${groupId}`);
