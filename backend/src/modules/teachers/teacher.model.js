import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed to prevent circular dependency

const Teacher = db.define(
  "teacher",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "schools", key: "id" },
    },

    employee_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },

    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    qualification: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    joining_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    approval_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    approved_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    pending_updates: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "teachers",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["user_id"] },
      {
        unique: true,
        fields: ["school_id", "employee_id"],
      },
    ],
  }
);

export default Teacher;
