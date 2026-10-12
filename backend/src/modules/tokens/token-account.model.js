import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const TokenAccount = db.define(
  "token_account",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
    },

    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "token_accounts",
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["expires_at"] },
    ],
  }
);

// Associations
export default TokenAccount;
