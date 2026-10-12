import { config } from "dotenv";
import { Sequelize } from "sequelize";

config();

console.log("🚀 DB_URI Used:", process.env.DB_URI); 

const db = new Sequelize(process.env.DB_URI, {
  dialect: "postgres",

  logging: false,

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  timezone: "+05:30",
});

export default db;