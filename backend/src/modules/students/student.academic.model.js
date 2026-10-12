import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const StudentAcademicRecord = db.define(
  "student_academic_record",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "students",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    academic_year_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "academic_years",
        key: "id",
      },
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
    },

    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "sections",
        key: "id",
      },
    },

    roll_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "active",
        "promoted",
        "retained",
        "transferred"
      ),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "student_academic_records",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["student_id", "academic_year_id"],
      },
      {
        fields: ["class_id", "section_id"],
      },
      {
        fields: ["academic_year_id"],
      },
    ],
  }
);

export default StudentAcademicRecord;
