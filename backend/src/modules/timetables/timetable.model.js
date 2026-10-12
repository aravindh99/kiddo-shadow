import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Timetable = db.define(
  "timetable",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
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

    day_of_week: {
      type: DataTypes.ENUM(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ),
      allowNull: false,
    },

    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    teacher_assignment_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // NULL = break
      references: { model: "teacher_assignments", key: "id" },
    },

    title: {
      type: DataTypes.STRING,
      allowNull: true, // "Lunch Break", "Short Break"
    },

    is_break: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    approval_status: {
      type: DataTypes.ENUM("approved", "pending", "rejected"),
      allowNull: false,
      defaultValue: "approved",
    },
  },
  {
    tableName: "timetables",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["class_id", "section_id"] },
      { fields: ["day_of_week"] },
      { fields: ["teacher_assignment_id"] },
    ],
  }
);

export default Timetable;
