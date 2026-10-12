import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const HomeworkReadStatus = db.define(
  "homework_read_status",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    homework_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "homeworks",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    student_read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    parent_read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "homework_read_statuses",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["homework_id", "student_id"],
      },
      { fields: ["student_id"] },
    ],
  }
);

export default HomeworkReadStatus;
