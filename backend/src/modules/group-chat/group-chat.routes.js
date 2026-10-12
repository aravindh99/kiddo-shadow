import express from "express";
import {
  createGroupChat,
  listGroupChats,
  getGroupMessagesController,
  deleteGroupChatController,
} from "./group-chat.controller.js";
import { protect } from "../../shared/middlewares/auth.js";
import { schoolScope } from "../../shared/middlewares/schoolScope.js";
import { allowRoles } from "../../shared/middlewares/role.js";

const router = express.Router();

router.use(protect, schoolScope);

router.post("/", allowRoles("teacher"), createGroupChat);
router.get("/", listGroupChats);
router.delete("/:chatId", allowRoles("teacher", "school_admin"), deleteGroupChatController);
router.get("/:chatId/messages", getGroupMessagesController);

export default router;
