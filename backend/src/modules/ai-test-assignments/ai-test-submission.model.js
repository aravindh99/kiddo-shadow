import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const AITestSubmission = db.define(
  "ai_test_submission",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "ai_test_assignments", key: "id" },
      onDelete: "CASCADE",
    },
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "schools", key: "id" },
    },
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "students", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "missed"),
      allowNull: false,
      defaultValue: "pending",
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    time_taken_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    score: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    correct_answers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    wrong_answers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    strong_topics: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    weak_topics: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evaluation_source: {
      type: DataTypes.ENUM("ai", "teacher", "fallback", "pending"),
      allowNull: false,
      defaultValue: "pending",
    },
    result_published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    teacher_reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attempt_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "ai_test_submissions",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["assignment_id"] },
      { fields: ["student_id"] },
      { fields: ["status"] },
      { unique: true, fields: ["assignment_id", "student_id"] },
    ],
  }
);

export default AITestSubmission;

