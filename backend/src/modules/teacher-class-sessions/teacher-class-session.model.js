import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const TeacherClassSession = db.define(
  "teacher_class_session",
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

    teacher_assignment_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "teacher_assignments",
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

    timetable_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // optional link to specific timetable slot
      references: {
        model: "timetables",
        key: "id",
      },
      onDelete: "SET NULL",
    },

    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "teacher_class_sessions",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["teacher_assignment_id"] },
      { fields: ["teacher_id"] },
      { fields: ["class_id"] },
      { fields: ["section_id"] },
      { fields: ["timetable_id"] },
      { fields: ["started_at"] },
    ],
  }
);

export default TeacherClassSession;
