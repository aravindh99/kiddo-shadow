import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const AiChatConversation = db.define(
  "ai_chat_conversation",
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
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    class_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "New Chat",
    },
    preview_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    message_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "ai_chat_conversations",
    underscored: true,
    indexes: [
      { fields: ["public_id"], unique: true },
      { fields: ["user_id", "deleted_at"] },
      { fields: ["user_id", "class_level"] },
      { fields: ["last_message_at"] },
    ],
  }
);

export default AiChatConversation;
