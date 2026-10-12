import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const VoiceLog = db.define(
  "voice_log",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "users", key: "id" },
    },

    purpose: {
      type: DataTypes.ENUM(
        "dictation",
        "question",
        "command",
        "revision",
        "general"
      ),
      allowNull: false,
      defaultValue: "general",
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tokens_used: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "voice_logs",
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["purpose"] },
      { fields: ["created_at"] },
    ],
  }
);

// Associations
export default VoiceLog;
