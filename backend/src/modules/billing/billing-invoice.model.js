import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const BillingInvoice = db.define(
  "billing_invoice",
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
    invoice_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    billing_month: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    period_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    period_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    student_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rate_per_student: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    base_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reference_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reference_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    commission_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    gst_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18,
    },
    gst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("generated", "sent", "paid", "cancelled"),
      allowNull: false,
      defaultValue: "generated",
    },
    generated_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "billing_invoices",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["billing_month"] },
      { unique: true, fields: ["school_id", "billing_month"] },
    ],
  }
);

export default BillingInvoice;
