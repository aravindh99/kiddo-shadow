import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const PaymentLog = db.define(
  "payment_log",
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
      allowNull: true,
      references: {
        model: "classes",
        key: "id",
      },
    },
    section_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "sections",
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    demand_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "not_paid",
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "paymentlogs",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["class_id"] },
      { fields: ["section_id"] },
      { fields: ["student_id"] },
      { fields: ["created_at"] },
    ],
  }
);

export default PaymentLog;
