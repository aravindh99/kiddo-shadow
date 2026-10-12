import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const HomeworkSubmission = db.define(
  "homework_submission",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    homework_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "homework_submissions",
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

export default HomeworkSubmission;
