import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GroupChatMessage = db.define(
  "group_chat_message",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    group_chat_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "group_chats",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    sender_user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    message_type: {
      type: DataTypes.ENUM("text", "image"),
      allowNull: false,
    },

    message_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "group_chat_messages",
    underscored: true,
    indexes: [
      { fields: ["group_chat_id"] },
      { fields: ["sender_user_id"] },
      { fields: ["created_at"] },
      { fields: ["group_chat_id", "created_at"] },
    ],
    validate: {
      messageContentCheck() {
        if (this.message_type === "text" && !this.message_text) {
          throw new Error("Text message must have message_text");
        }

        if (this.message_type === "image" && !this.image_url) {
          throw new Error("Image message must have image_url");
        }
      },
    },
  }
);

export default GroupChatMessage;
