// src/modules/game/game-session-player.model.js
import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const GameSessionPlayer = db.define(
  "game_session_player",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    session_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "game_sessions",
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

    socket_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    is_host: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    current_question_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM(
        "JOINED",
        "READY",
        "PLAYING",
        "DISCONNECTED",
        "FINISHED"
      ),
      allowNull: false,
      defaultValue: "JOINED",
    },

    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    finished_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "game_session_players",
    underscored: true,
    indexes: [
      { fields: ["session_id"] },
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["session_id", "score", "finished_at"] },
      {
        unique: true,
        fields: ["session_id", "user_id"], // 🔒 prevent duplicate joins
      },
    ],
  }
);

// Associations
export default GameSessionPlayer;
