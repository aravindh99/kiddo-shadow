// src/socket/group-chat.socket.js
import jwt from "jsonwebtoken";
import GroupChat from "../modules/group-chat/group-chat.model.js";
import GroupChatMember from "../modules/group-chat/group-chat-member.model.js";
import {
  isUserMemberOfChat,
  createGroupChatMessage,
} from "../modules/group-chat/group-chat.service.js";

export function initGroupChatSocket(io) {
  /**
   * SOCKET AUTH (JWT)
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        id: decoded.id,
        role: decoded.role,
        school_id: decoded.school_id,
      };

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    /**
     * JOIN GROUP CHAT ROOM
     */
    socket.on("group:join", async ({ chatId }) => {
      const isMember = await isUserMemberOfChat(chatId, socket.user.id);
      if (!isMember) {
        socket.emit("group:error", {
          message: "You are not a member of this group",
        });
        return;
      }

      socket.join(`group:${chatId}`);

      socket.emit("group:joined", { chatId });
    });

    /**
     * SEND GROUP CHAT MESSAGE
     * - text or image
     */
    socket.on(
      "group:message",
      async ({ chatId, type, text, imageUrl }) => {
        const isMember = await isUserMemberOfChat(chatId, socket.user.id);
        if (!isMember) {
          socket.emit("group:error", {
            message: "You are not a member of this group",
          });
          return;
        }

        const chat = await GroupChat.findByPk(chatId);
        if (!chat || !chat.is_active) {
          socket.emit("group:error", {
            message: "Group chat is inactive",
          });
          return;
        }

        const message = await createGroupChatMessage({
          chatId,
          senderUserId: socket.user.id,
          messageType: type,
          messageText: text,
          imageUrl,
        });

        io.to(`group:${chatId}`).emit("group:message:new", {
          id: message.id,
          chatId,
          senderUserId: socket.user.id,
          type,
          text: message.message_text,
          imageUrl: message.image_url,
          createdAt: message.created_at,
        });
      }
    );

    /**
     * LEAVE SOCKET ROOM (optional, implicit on disconnect)
     */
    socket.on("group:leave", ({ chatId }) => {
      socket.leave(`group:${chatId}`);
    });
  });
}
