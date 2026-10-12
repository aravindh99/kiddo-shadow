import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import { resolveTeacherId } from "../../shared/utils/resolveTeacherId.js";
import {
  markAttendanceService,
  getTeacherAttendanceSummaryService,
  getParentAttendanceSummaryService,
  getStudentAttendanceSummaryService,
} from "./attendance.summary.service.js";

/* =========================
   TEACHER: MARK
========================= */
export const markAttendance = asyncHandler(async (req, res) => {
  const teacherId = await resolveTeacherId(req.user);
  if (!teacherId) {
    throw new AppError("Teacher profile not found", 404);
  }

  const result = await markAttendanceService({
    user: req.user,
    teacher_id: teacherId,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    message: result?.message || "Attendance marked successfully",
    saved: result?.saved ?? 0,
    skipped: result?.skipped ?? [],
  });
});

/* =========================
   TEACHER: SUMMARY
========================= */
export const getTeacherAttendanceSummary = asyncHandler(async (req, res) => {
  const teacherId = await resolveTeacherId(req.user);
  if (!teacherId) {
    throw new AppError("Teacher profile not found", 404);
  }

  const result = await getTeacherAttendanceSummaryService({
    school_id: req.user.school_id,
    query: req.query,
    teacher_id: teacherId,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* =========================
   PARENT: SUMMARY
========================= */
export const getParentAttendanceSummary = asyncHandler(async (req, res) => {
  const result = await getParentAttendanceSummaryService({
    parent_user_id: req.user.id,
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* =========================
   STUDENT: SUMMARY
========================= */
export const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const result = await getStudentAttendanceSummaryService({
    student_user_id: req.user.id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});
