import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const TokenPolicy = db.define(
  "token_policy",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    role: {
      type: DataTypes.ENUM("student", "teacher"),
      allowNull: false,
      unique: true,
    },

    monthly_tokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    updated_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "token_policies",
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ["role"] }],
  }
);

export default TokenPolicy;
