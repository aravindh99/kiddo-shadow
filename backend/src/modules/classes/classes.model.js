import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Class = db.define(
  "class",
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

    class_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    class_teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "teachers",
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
    tableName: "classes",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["school_id", "class_name"],
      },
    ],
  }
);

export default Class;
