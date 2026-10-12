import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const ExamTimetable = db.define(
  "exam_timetable",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    exam_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "exams", key: "id" },
    },
    subject_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "subjects", key: "id" },
    },
    exam_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    max_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    passing_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "exam_timetables",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["exam_id"] },
      { fields: ["subject_id"] },
      { unique: true, fields: ["exam_id", "subject_id"] }, // A subject usually occurs once per exam
      { unique: true, fields: ["exam_id", "exam_date", "start_time"] }, // Prevent time conflict within same exam
    ],
  }
);

export default ExamTimetable;
