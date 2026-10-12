import dotenv from "dotenv";
dotenv.config();

import db from "../config/db.js";
import User from "../modules/users/user.model.js";

const run = async () => {
  try {
    await db.authenticate();

    const username = process.env.SUPER_ADMIN_USERNAME;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!username || !password) {
      throw new Error("SUPER_ADMIN_USERNAME or PASSWORD missing");
    }

    const exists = await User.findOne({
      where: { role: "super_admin" },
    });

    if (exists) {
      console.log("Super admin already exists");
      process.exit(0);
    }

    await User.create({
      role: "super_admin",
      username,
      password,
      name: "Super Admin",
      is_active: true,
      first_login: false,
    });

    console.log("✅ Super admin created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create super admin", err);
    process.exit(1);
  }
};

run();
