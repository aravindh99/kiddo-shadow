import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GroupChatMember = db.define(
  "group_chat_member",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    group_chat_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "group_chats",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    role: {
      type: DataTypes.ENUM("teacher", "student"),
      allowNull: false,
    },

    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "group_chat_members",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["group_chat_id", "user_id"],
        name: "uq_group_chat_member",
      },
      { fields: ["group_chat_id"] },
      { fields: ["user_id"] },
      { fields: ["role"] },
    ],
  }
);

export default GroupChatMember;
