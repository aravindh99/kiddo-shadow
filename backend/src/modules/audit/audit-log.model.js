import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const AuditLog = db.define(
  "audit_log",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    audit_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    school_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    school_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    module: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING, // Kept as string to support uuids or string ids if needed
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    old_value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING, // e.g., 'Success', 'Failed', 'Warning'
      allowNull: true,
    },
    request_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    http_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    response_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    execution_time: {
      type: DataTypes.INTEGER, // in ms
      allowNull: true,
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    os: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    device: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    performed_by: {
      type: DataTypes.BIGINT,
      allowNull: true, // Making true since some automated actions might not have an ID
    },
  },
  {
    tableName: "audit_logs",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["module"] },
      { fields: ["action"] },
      { fields: ["status"] },
      { fields: ["entity_type", "entity_id"] },
      { fields: ["performed_by"] },
      { fields: ["user_id"] },
    ],
  }
);

export default AuditLog;
