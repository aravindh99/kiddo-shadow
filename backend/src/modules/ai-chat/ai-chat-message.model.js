import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const AiChatMessage = db.define(
  "ai_chat_message",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    public_id: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    conversation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "ai_chat_conversations",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    role: {
      type: DataTypes.ENUM("user", "ai", "system"),
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image_preview_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "ai_chat_messages",
    underscored: true,
    indexes: [
      { fields: ["public_id"], unique: true },
      { fields: ["conversation_id", "sent_at"] },
      { fields: ["user_id", "sent_at"] },
    ],
  }
);

export default AiChatMessage;
