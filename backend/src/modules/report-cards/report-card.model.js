import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const ReportCard = db.define(
  "report_card",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "students", key: "id" },
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "classes", key: "id" },
    },

    exam_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "exams", key: "id" },
    },
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "schools", key: "id" },
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "report_cards",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["student_id"] },
      { fields: ["exam_id"] },
      {
        unique: true,
        fields: ["student_id", "exam_id"],
      },
    ],
  }
);

export default ReportCard;
