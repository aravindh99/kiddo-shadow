import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const AITestAssignment = db.define(
  "ai_test_assignment",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "schools", key: "id" },
    },
    teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "teachers", key: "id" },
    },
    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "classes", key: "id" },
    },
    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "sections", key: "id" },
    },
    subject_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "subjects", key: "id" },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    chapter_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    generated_content: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    generated_meta: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    max_score: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    has_time_limit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lock_mode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allow_retry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    result_visibility: {
      type: DataTypes.ENUM("immediate", "after_review", "hidden"),
      allowNull: false,
      defaultValue: "immediate",
    },
    assigned_scope: {
      type: DataTypes.ENUM("selected_students", "full_class"),
      allowNull: false,
      defaultValue: "selected_students",
    },
    status: {
      type: DataTypes.ENUM("assigned", "closed"),
      allowNull: false,
      defaultValue: "assigned",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "ai_test_assignments",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["teacher_id"] },
      { fields: ["class_id"] },
      { fields: ["section_id"] },
      { fields: ["status"] },
    ],
  }
);

export default AITestAssignment;

