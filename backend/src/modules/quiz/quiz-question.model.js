import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const QuizQuestion = db.define(
  "quiz_question",
  {
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

    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    options: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    correct_option_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "quiz_questions",
    underscored: true,
    indexes: [
      { fields: ["quiz_id"] },
      { unique: true, fields: ["quiz_id", "order_index"] },
    ],
  }
);

export default QuizQuestion;
