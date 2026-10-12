import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Attendance = db.define("attendance", {
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

  teacher_class_session_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: "teacher_class_sessions", key: "id" },
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

  student_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: "students", key: "id" },
  },

  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM("present", "absent", "leave", "on_duty"),
    allowNull: false,
  },

  marked_by: {
    type: DataTypes.BIGINT, // user_id
    allowNull: false,
    references: { model: "users", key: "id" },
  },
}, {
  tableName: "attendances",
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["student_id", "teacher_class_session_id"],
    },
    { fields: ["school_id"] },
    { fields: ["class_id"] },
    { fields: ["section_id"] },
    { fields: ["date"] },
    { fields: ["teacher_class_session_id"] },
    { fields: ["student_id"] },
  ],
});

export default Attendance;
