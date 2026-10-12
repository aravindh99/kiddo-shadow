import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Notification = db.define(
  "notification",
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

    sender_user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    sender_role: {
      type: DataTypes.ENUM("school_admin", "teacher", "student", "parent"),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    /* TARGETING */
    target_role: {
      type: DataTypes.ENUM("school_admin", "teacher", "parent", "student", "all"),
      allowNull: false,
    },

    target_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // teacher → own class, admin optional
    },

    section_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "notifications",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["target_role"] },
      { fields: ["class_id"] },
    ],
  }
);

export default Notification;
