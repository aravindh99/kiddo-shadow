import asyncHandler from "../../shared/asyncHandler.js";
import jwt from "jsonwebtoken";
import AppError from "../../shared/appError.js";
import {
 createStudentService,
  listStudentsService,
  moveStudentService,
  updateStudentStatusService,
  assignStudentsToSectionService,
  listStudentsForTeacherSectionService,
  listStudentOptionsService,
  getStudentInsightsService,
} from "./student.service.js";
import Student from "./student.model.js";
import User from "../users/user.model.js";
import Parent from "../parents/parent.model.js";
import { triggerNewProfileNotification } from "../notifications/notification-trigger.service.js";

/* ADMIN: AUTO CREATE */
export const createStudent = asyncHandler(async (req, res) => {
  const result = await createStudentService({
    school_id: req.user.school_id,
    class_id: req.body.class_id,
    section_id: req.body.section_id,
  });

  res.status(201).json({
    created: 1,
    student: result,
    students: [result],
  });
});

/* ADMIN: LIST */
export const listStudents = asyncHandler(async (req, res) => {
  let school_id = req.user.school_id;
  if (req.user.role === "super_admin") {
    if (req.query.school_id !== undefined) {
      school_id = Number(req.query.school_id);
      if (!Number.isFinite(school_id)) {
        throw new AppError("Invalid school_id", 400);
      }
    } else {
      school_id = undefined;
    }
  }

  const result = await listStudentsService({
    school_id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* ADMIN: MOVE */
export const moveStudent = asyncHandler(async (req, res) => {
  const student = await moveStudentService({
    student_id: req.params.id,
    section_id: req.body.section_id,
    school_id: req.user.school_id,
  });
  res.json({ message: "Student moved", student });
});

/* ADMIN: STATUS */
export const updateStudentStatus = asyncHandler(async (req, res) => {
  const student = await updateStudentStatusService({
    student_id: req.params.id,
    is_active: req.body.is_active,
    school_id: req.user.school_id,
  });
  res.json({ message: "Status updated", student });
});

/* STUDENT: COMPLETE PROFILE */
export const completeStudentProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    dob,
    gender,
    blood_group,
    father_name,
    mother_name,
    guardian_name,
    father_occupation,
    mother_occupation,
    address,
    family_income,
    avatar_url,
  } = req.body;

  const student = await Student.findOne({
    where: { user_id: req.user.id },
  });
  if (!student) throw new AppError("Student profile not found", 404);

  const isProfileUpdate = student.approval_status === "approved" && !req.user.first_login;

  if (isProfileUpdate) {
    const { requestStudentProfileUpdateService } = await import("./student.approval.service.js");
    await requestStudentProfileUpdateService(req.user.id, req.body);
    return res.json({ message: "Profile update request submitted", user: req.user });
  }

  if (req.body.email) {
    const existing = await User.findOne({ where: { email: req.body.email } });
    if (existing && existing.id !== req.user.id) {
      throw new AppError("Email already in use", 400);
    }
  }

  const userUpdates = {};
  if (name !== undefined) userUpdates.name = name;
  if (phone !== undefined) {
    userUpdates.phone = phone;
  }
  if (req.body.email !== undefined) userUpdates.email = req.body.email;
  if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url || null;
  userUpdates.first_login = false;

  if (Object.keys(userUpdates).length > 0) {
    await User.update(userUpdates, { where: { id: req.user.id } });
  }

  const studentUpdates = {
    dob,
    gender,
    blood_group,
    father_name,
    mother_name,
    guardian_name,
    father_occupation,
    mother_occupation,
    address,
    family_income,
    approval_status: "pending",
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
  };

  await student.update(studentUpdates);

  /* Create new token */
  const token = jwt.sign(
    {
      id: req.user.id,
      role: req.user.role,
      school_id: req.user.school_id,
      iat: Date.now(),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Send notification to school admin
  try {
    await triggerNewProfileNotification({
      school_id: req.user.school_id,
      sender_user_id: req.user.id,
      sender_role: "student",
      user_name: req.user.name,
    });
  } catch (notifErr) {
    console.error("Failed to send notification:", notifErr);
  }

  res.json({ message: "Profile completed", token, user: req.user });
});

/* STUDENT: MY PROFILE */
export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    where: { user_id: req.user.id },
    include: [User, "class", "section"],
  });
  if (!student) throw new AppError("Student profile not found", 404);

  const data = student.get({ plain: true });
  const user = data.user || {};

  const linkedParent = await Parent.findOne({
    where: { student_id: student.id },
    include: [{ model: User, required: false }],
  });
  const linkedParentPhone = linkedParent?.user?.phone || "";
  const resolvedPhone = user.phone || linkedParentPhone || "";
  res.json({
    ...data,
    ...user,
    approval_status: data.approval_status,
    phone: resolvedPhone,
    avatar_url: user.avatar_url || "",
  });
});


//assign students to section

export const assignStudentsToSection = asyncHandler(async (req, res) => {
  const result = await assignStudentsToSectionService({
    school_id: req.user.school_id,
    ...req.body,
  });

  if (result?.error === "CLASS_NOT_FOUND") {
    throw new AppError("Target class not found", 404);
  }

  if (result?.error === "SECTION_NOT_FOUND") {
    throw new AppError("Target section not found or inactive", 404);
  }

  res.json({
    success: true,
    message: "Students assigned successfully",
  });
});

/* ADMIN: OPTIONS */
export const listStudentOptions = asyncHandler(async (req, res) => {
  const result = await listStudentOptionsService({
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    total: result.length,
    items: result,
  });
});

/* TEACHER: LIST STUDENTS IN ASSIGNED SECTION */
export const listStudentsForTeacherSection = asyncHandler(async (req, res) => {
  const result = await listStudentsForTeacherSectionService({
    user: req.user,
    query: req.query,
  });

  res.json({
    total: result.length,
    items: result,
  });
});

export const getStudentInsights = asyncHandler(async (req, res) => {
  const data = await getStudentInsightsService({
    student_id: Number(req.params.id),
    user: req.user,
  });

  res.json(data);
});
