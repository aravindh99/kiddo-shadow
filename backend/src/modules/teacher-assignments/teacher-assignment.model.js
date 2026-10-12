import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const TeacherAssignment = db.define(
  "teacher_assignment",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "schools",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "teachers",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "sections",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    subject_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "subjects",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    academic_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "2025-2026",
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_class_teacher: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "teacher_assignments",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["teacher_id"] },
      { fields: ["class_id"] },
      {
        unique: true,
        fields: ["school_id", "teacher_id", "class_id", "section_id", "subject_id", "academic_year"],
      },
    ],
  }
);

export default TeacherAssignment;
