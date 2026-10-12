import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const NotificationAck = db.define(
  "notification_ack",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    notification_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    user_role: {
      type: DataTypes.ENUM("teacher", "parent", "student", "school_admin"),
      allowNull: false,
    },

    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "notification_acks",
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["notification_id", "user_id"],
      },
      { fields: ["notification_id"] },
    ],
  }
);

export default NotificationAck;
