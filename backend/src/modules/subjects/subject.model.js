import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const Subject = db.define(
  "subject",
  {
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
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    category: {
      type: DataTypes.ENUM("theory", "practical", "both"),
      allowNull: false,
      defaultValue: "theory",
    },
  },
  {
    tableName: "subjects",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { unique: true, fields: ["school_id", "name"] },
    ],
  }
);

export default Subject;
