import asyncHandler from "../../shared/asyncHandler.js";
import jwt from "jsonwebtoken";
import AppError from "../../shared/appError.js";
import db from "../../config/db.js";
import {
  createTeacherService,
  getTeacherStudentReportsService,
  listTeachersService,
  listTeachersBySectionService,
  updateTeacherStatusService,
  listTeacherOptionsService,
} from "./teacher.service.js";
import Teacher from "./teacher.model.js";
import User from "../users/user.model.js";
import { triggerNewProfileNotification } from "../notifications/notification-trigger.service.js";

const RETRYABLE_DB_CODES = new Set(["57P03", "57P01", "08006", "08001"]);

function isRetryableDbError(err) {
  const code = err?.original?.code || err?.parent?.code;
  const message = String(err?.message || "").toLowerCase();
  return (
    RETRYABLE_DB_CODES.has(code) ||
    message.includes("connection terminated unexpectedly") ||
    message.includes("database system is in recovery mode")
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ADMIN: CREATE */
export const createTeacher = asyncHandler(async (req, res) => {
  const result = await createTeacherService({
    school_id: req.user.school_id,
    username: req.body.username,
    password: req.body.password,
    class_id: req.body.class_id,
    section_id: req.body.section_id,
  });

  res.status(201).json(result);
});

/* ADMIN: LIST */
export const listTeachers = asyncHandler(async (req, res) => {
  const result = await listTeachersService({
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* ADMIN: LIST BY SECTION */
export const listTeachersBySection = asyncHandler(async (req, res) => {
  const result = await listTeachersBySectionService({
    school_id: req.user.school_id,
    section_id: req.params.sectionId,
  });

  res.json({
    total: result.length,
    items: result,
  });
});

/* ADMIN: OPTIONS */
export const listTeacherOptions = asyncHandler(async (req, res) => {
  const result = await listTeacherOptionsService({
    school_id: req.user.school_id,
    day_of_week: req.query.day_of_week,
    start_time: req.query.start_time,
    end_time: req.query.end_time,
  });

  res.json({
    total: result.length,
    items: result,
  });
});

/* ADMIN: STATUS */
export const updateTeacherStatus = asyncHandler(async (req, res) => {
  const teacher = await updateTeacherStatusService({
    teacher_id: req.params.id,
    is_active: req.body.is_active,
    school_id: req.user.school_id,
  });

  res.json({ message: "Status updated", teacher });
});

/* TEACHER: COMPLETE PROFILE */
export const completeTeacherProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    gender,
    designation,
    qualification,
    experience,
    avatar_url,
  } = req.body;

  const teacher = await Teacher.findOne({
    where: { user_id: req.user.id },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const isProfileUpdate = teacher.approval_status === "approved" && !req.user.first_login;

  if (isProfileUpdate) {
    const { requestTeacherProfileUpdateService } = await import("./teacher.approval.service.js");
    await requestTeacherProfileUpdateService(req.user.id, req.body);
    return res.json({ message: "Profile update request submitted", user: req.user });
  }

  let user;
  const maxRetries = 1;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      await db.transaction(async (transaction) => {
        if (email) {
          const existing = await User.findOne({ where: { email }, transaction });
          if (existing && existing.id !== req.user.id) {
            throw new AppError("Email already in use", 400);
          }
        }

        if (phone) {
          const existingPhone = await User.findOne({ where: { phone }, transaction });
          if (existingPhone && existingPhone.id !== req.user.id) {
            const isSharedRole = ["parent", "teacher", "student"].includes(existingPhone.role);
            const isSameSchool = Number(existingPhone.school_id) === Number(req.user.school_id);
            if (!isSharedRole || !isSameSchool) {
              throw new AppError("Phone already in use", 400);
            }
          }
        }

        const userUpdates = {};
        if (name !== undefined) userUpdates.name = name;
        if (phone !== undefined) userUpdates.phone = phone;
        if (email !== undefined) userUpdates.email = email;
        if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url || null;
        userUpdates.first_login = false;

        if (Object.keys(userUpdates).length > 0) {
          await User.update(userUpdates, {
            where: { id: req.user.id },
            transaction,
          });
        }

        const teacherUpdates = {
          approval_status: "pending",
          approved_by: null,
          approved_at: null,
          rejection_reason: null,
        };
        if (gender !== undefined) teacherUpdates.gender = gender;
        if (designation !== undefined) teacherUpdates.designation = designation;
        if (qualification !== undefined) teacherUpdates.qualification = qualification;
        if (experience !== undefined) teacherUpdates.experience = experience;

        await teacher.update(teacherUpdates, { transaction });

        user = await User.findByPk(req.user.id, { transaction });
      });

      break;
    } catch (err) {
      if (attempt < maxRetries && isRetryableDbError(err)) {
        attempt += 1;
        await wait(400);
        continue;
      }
      throw err;
    }
  }

  /* Create new token */
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      iat: Date.now(),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Send notification to school admin
  try {
    await triggerNewProfileNotification({
      school_id: user.school_id,
      sender_user_id: user.id,
      sender_role: "teacher",
      user_name: user.name,
    });
  } catch (notifErr) {
    console.error("Failed to send notification:", notifErr);
  }

  res.json({ message: "Profile completed", token, user });
});

/* TEACHER: MY PROFILE */
export const getMyProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    where: { user_id: req.user.id },
    include: [User],
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const data = teacher.get({ plain: true });
  const user = data.user || data.User || {};

  res.json({
    ...data,
    ...user,
    approval_status: data.approval_status,
    avatar_url: user.avatar_url || "",
  });
});

export const getTeacherStudentReports = asyncHandler(async (req, res) => {
  const data = await getTeacherStudentReportsService({ user: req.user });
  res.json(data);
});
