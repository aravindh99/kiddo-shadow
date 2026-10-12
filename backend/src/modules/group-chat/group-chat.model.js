import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GroupChat = db.define(
  "group_chat",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    subject_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "subjects",
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

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "group_chats",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["teacher_id", "subject_id", "section_id"],
        name: "uq_teacher_subject_section_chat",
      },
      { fields: ["teacher_id"] },
      { fields: ["section_id"] },
      { fields: ["subject_id"] },
    ],
  }
);

export default GroupChat;
