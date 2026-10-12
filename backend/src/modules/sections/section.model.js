import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Section = db.define(
  "section",
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

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
    },

    class_teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "teachers",
        key: "id",
      },
    },

    name: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "sections",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["school_id", "class_id", "name"],
      },
      { fields: ["school_id"] },
      { fields: ["class_id"] },
    ],
  }
);

export default Section;
