import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import {
  createFollowupController,
  deleteConversationController,
  getConversationController,
  getConversationMessagesController,
  listConversationsController,
  restoreConversationController,
  syncConversationsController,
  upsertConversationController,
} from "./ai-chat.controller.js";

const router = express.Router();

router.use(protect);

router.post("/followup", createFollowupController);
router.get("/conversations", listConversationsController);
router.get("/conversations/:conversationId", getConversationController);
router.get("/conversations/:conversationId/messages", getConversationMessagesController);
router.post("/conversations/sync", syncConversationsController);
router.post("/conversations", upsertConversationController);
router.delete("/conversations/:conversationId", deleteConversationController);
router.post("/conversations/:conversationId/restore", restoreConversationController);

export default router;
