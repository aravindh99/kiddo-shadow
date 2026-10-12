import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const AiChatLog = db.define(
  "ai_chat_log",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    user_query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    ai_response: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    tokens_used: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    model_used: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    ai_type: {
      type: DataTypes.ENUM(
        "rag",
        "chat",
        "quiz",
        "homework",
        "summary",
        "question_paper",
        "lesson_summary"
      ),
      allowNull: false,
      defaultValue: "chat",
    },

    class_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "ai_chat_logs",
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["ai_type"] },
      { fields: ["created_at"] },
    ],
  }
);

export default AiChatLog;
