import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Homework = db.define("homework", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
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

  teacher_assignment_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: "teacher_assignments",
      key: "id",
    },
    onDelete: "CASCADE",
  },

  subject_id: {
    type: DataTypes.BIGINT,
    allowNull: false, // derived from assignment
    references: {
      model: "subjects",
      key: "id",
    },
    onDelete: "CASCADE",
  },

  homework_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  attachment_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  created_by: {
    type: DataTypes.BIGINT, // user_id
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
}, {
  tableName: "homeworks",
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ["school_id"] },
    { fields: ["class_id", "section_id"] },
    { fields: ["teacher_assignment_id"] },
    { fields: ["homework_date"] },
  ],
});

export default Homework;
