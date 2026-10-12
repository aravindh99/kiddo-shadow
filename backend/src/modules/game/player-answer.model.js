import { DataTypes } from "sequelize";
import db from "../../config/db.js";


const PlayerAnswer = db.define(
  "player_answer",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    session_player_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "game_session_players",
        key: "id",
      },
    },

    question_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "quiz_questions",
        key: "id",
      },
    },

    selected_option_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },

    time_taken_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    answered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "player_answers",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["session_player_id", "question_id"],
        name: "uq_player_answer_session_question",
      },
      { fields: ["session_player_id"] },
      { fields: ["question_id"] },
      { fields: ["answered_at"] },
    ],
  }
);


export default PlayerAnswer;
