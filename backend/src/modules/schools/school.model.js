import { DataTypes } from "sequelize";
import db from "../../config/db.js";


const School = db.define(
  "school",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    school_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    school_code: {
      type: DataTypes.STRING,
      allowNull: false, 
      unique: true,
    },
    school_type: {
      type: DataTypes.ENUM("state", "cbse"),
      allowNull: false,
      defaultValue: "cbse",
    },

    cbse_affiliation_no: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    zip: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    reference_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    reference_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    payment_mode: {
      type: DataTypes.ENUM("half_yearly", "quarterly", "annual"),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("pending", "active", "suspended", "expired"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "schools",
    underscored: true,
    indexes: [
      { fields: ["status"] },
      { fields: ["city"] },
      { fields: ["state"] },
    ],
  }
);

export default School;
    
