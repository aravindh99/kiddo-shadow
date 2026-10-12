// src/modules/game/game-session.model.js
import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const GameSession = db.define("game_session", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  quiz_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: "quizzes",
      key: "id",
    },
  },
  mode: {
    type: DataTypes.ENUM("SINGLE", "MULTI"),
    allowNull: false,
  },
  room_code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  host_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
  },
  max_players: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  total_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("LOBBY", "IN_PROGRESS", "FINISHED", "CANCELLED"),
    allowNull: false,
    defaultValue: "LOBBY",
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "game_sessions",
  underscored: true,
  indexes: [
    { fields: ["quiz_id"] },
    { fields: ["host_user_id"] },
    { fields: ["status"] },
    { fields: ["room_code"] }
  ]
});

export default GameSession;
