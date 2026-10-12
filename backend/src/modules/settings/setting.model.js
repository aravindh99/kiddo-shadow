import { DataTypes, Model } from 'sequelize';
import db from '../../config/db.js';

class SystemSetting extends Model {}

SystemSetting.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true,
  }
);

export default SystemSetting;
