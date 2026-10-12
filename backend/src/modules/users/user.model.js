import { DataTypes } from "sequelize";
import db from "../../config/db.js";


const User = db.define(
  "user",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    // null only for super_admin
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "schools", key: "id" },
    },

    role: {
      type: DataTypes.ENUM(
        "super_admin",
        "school_admin",
        "teacher",
        "student",
        "parent"
      ),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    first_login: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["role"] },
      { fields: ["phone"] },
      {
        unique: true,
        fields: ["school_id", "username"],
      },
    ],
  }
);

export default User;
