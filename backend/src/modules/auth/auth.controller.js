import jwt from "jsonwebtoken";
import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import User from "../users/user.model.js";
import School from "../schools/school.model.js";
import Parent from "../parents/parent.model.js";

const failedAttempts = new Map();

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body; // already validated by Zod
  const loginUsername = String(username || "").trim();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginUsername);

  const { Op, where, fn, col } = await import("sequelize");

  const lowerLogin = loginUsername.toLowerCase();

  let users = await User.findAll({
    where: {
      [Op.or]: [
        where(fn('lower', col('username')), lowerLogin),
        where(fn('lower', col('email')), lowerLogin),
        { phone: loginUsername }
      ]
    }
  });

  if (!users || users.length === 0) {
    const school = await School.findOne({
      where: where(fn("lower", col("school_name")), lowerLogin),
      attributes: ["id"],
    });

    if (school) {
      users = await User.findAll({
        where: {
          school_id: school.id,
          role: "school_admin",
        },
      });
    }
  }

  const loginKey = String(username || "").trim().toLowerCase();
  const lockoutRecord = failedAttempts.get(loginKey);
  if (lockoutRecord) {
    if (lockoutRecord.lockUntil && lockoutRecord.lockUntil > Date.now()) {
      throw new AppError("Too many wrong password attempts. Please contact your admin.", 403);
    }
    if (lockoutRecord.lockUntil && lockoutRecord.lockUntil <= Date.now()) {
      failedAttempts.delete(loginKey);
    }
  }

  // check user exists
  if (!users || users.length === 0) {
    // Bootstrap super admin on first login if env credentials are configured
    const envSuperUsername = process.env.SUPER_ADMIN_USERNAME;
    const envSuperPassword = process.env.SUPER_ADMIN_PASSWORD;
    const isSuperAdminLogin =
      loginUsername === envSuperUsername && password === envSuperPassword;

    if (isSuperAdminLogin) {
      const existingSuperAdmin = await User.findOne({
        where: { role: "super_admin" },
      });

      if (!existingSuperAdmin) {
        const superUser = await User.create({
          role: "super_admin",
          username: envSuperUsername,
          password: envSuperPassword,
          name: "Super Admin",
          is_active: true,
          first_login: false,
        });
        users = [superUser];
      } else {
        users = [existingSuperAdmin];
      }
    } else {
      const record = failedAttempts.get(loginKey) || { count: 0 };
      record.count += 1;
      if (record.count >= 3) {
        record.lockUntil = Date.now() + 15 * 60 * 1000;
        failedAttempts.set(loginKey, record);
        throw new AppError("Too many wrong password attempts. Please contact your admin.", 403);
      }
      failedAttempts.set(loginKey, record);
      throw new AppError("Invalid username or password.", 401);
    }
  }

  // Filter users by matching password
  const matchedUsers = users.filter(u => u.password === password);
  if (matchedUsers.length === 0) {
    const record = failedAttempts.get(loginKey) || { count: 0 };
    record.count += 1;
    if (record.count >= 3) {
      record.lockUntil = Date.now() + 15 * 60 * 1000;
      failedAttempts.set(loginKey, record);
      throw new AppError("Too many wrong password attempts. Please contact your admin.", 403);
    }
    failedAttempts.set(loginKey, record);
    throw new AppError("Invalid username or password.", 401);
  }

  failedAttempts.delete(loginKey);

  // If multiple users match (e.g. parent and student sharing phone and password), pick the highest role
  const rolePriority = { super_admin: 5, school_admin: 4, teacher: 3, parent: 2, student: 1 };
  matchedUsers.sort((a, b) => rolePriority[b.role] - rolePriority[a.role]);

  let user = matchedUsers[0];

  // if (!user) {
  //   throw new AppError("User not found", 401);
  // }

  // if (!user.is_active) {
  //   throw new AppError("User account disabled", 403);
  // }

  // if (password !== user.password) {
  //   throw new AppError("Password is wrong", 401);
  // }

  // school check (except super admin)
  let school = null;
  if (user.role !== "super_admin") {
    school = await School.findByPk(user.school_id);
    if (!school || school.status !== "active") {
      throw new AppError("School is inactive", 403);
    }
  }

  if (user.role === "parent") {
    // Bypassed parent approval check
  }

  // For students, fetch class/section info
  let additionalClaims = {};
  if (user.role === "student") {

    const Student = (await import("../students/student.model.js")).default;
    const student = await Student.findOne({
      where: { user_id: user.id },
      attributes: ["id", "class_id", "section_id"],
    });

    if (student) {
      additionalClaims = {
        class_id: student.class_id,
        section_id: student.section_id,
        student_id: student.id
      };
    }
  }

  // Embed school branding
  if (school) {
    additionalClaims.school_name = school.school_name;
    additionalClaims.school_logo_url = school.logo_url;
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      ...additionalClaims
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;

  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (old_password !== user.password) {
    throw new AppError("Current password is incorrect", 400);
  }

  if (old_password === new_password) {
    throw new AppError("New password cannot be the same as the old password", 400);
  }

  user.password = new_password;
  await user.save();

  res.json({
    message: "Password updated successfully",
  });
});

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No profile image provided", 400);
  }

  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const avatarUrl = `/uploads/profile-images/${req.file.filename}`;
  
  user.avatar_url = avatarUrl;
  await user.save();

  res.json({
    success: true,
    message: "Profile image updated successfully",
    avatar_url: avatarUrl,
  });
});
