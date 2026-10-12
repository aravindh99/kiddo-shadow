import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const Parent = db.define(
  "parent",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "students",
        key: "id",
      },
    },

    pending_updates: {
      type: DataTypes.JSON,
      allowNull: true,
    },

 approval_status: {
  type: DataTypes.ENUM("pending", "approved", "rejected"),
  allowNull: false,
  defaultValue: "pending",
  },

approved_by: {
  type: DataTypes.BIGINT,
  allowNull: true,
  references: {
    model: "users",
    key: "id",
  },
},

approved_at: {
  type: DataTypes.DATE,
  allowNull: true,
},

  
    relation_type: {
      type: DataTypes.ENUM("mother", "father", "guardian"),
      allowNull: false,
    },
  },
  {
    tableName: "parents",
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["student_id"] },
      {
        unique: true,
        fields: ["student_id", "user_id"],
      },
    ],
  }
);

export default Parent;