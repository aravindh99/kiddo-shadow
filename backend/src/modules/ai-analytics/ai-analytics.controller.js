import asyncHandler from "../../shared/asyncHandler.js";
import {
  getSchoolAnalytics,
  getSchoolUserUsage,
  getSchoolClassUsage,
  getTeacherAnalytics,
  getStudentDailyUsage,
  getStudentPersonalizedInsights,
} from "./ai-analytics.service.js";

/* ===================== SCHOOL ===================== */
export const schoolAiAnalytics = asyncHandler(async (req, res) => {
  const schoolId =
    req.user.role === "super_admin" && req.query.school_id
      ? Number(req.query.school_id)
      : req.user.school_id;

  const data = await getSchoolAnalytics(schoolId);
  res.json(data);
});

export const schoolUserUsage = asyncHandler(async (req, res) => {
  const schoolId =
    req.user.role === "super_admin" && req.query.school_id
      ? Number(req.query.school_id)
      : req.user.school_id;
  const role = req.query.role || "student";

  const data = await getSchoolUserUsage(schoolId, role);
  res.json(data);
});

export const schoolClassUsage = asyncHandler(async (req, res) => {
  const schoolId =
    req.user.role === "super_admin" && req.query.school_id
      ? Number(req.query.school_id)
      : req.user.school_id;

  const data = await getSchoolClassUsage(schoolId);
  res.json(data);
});

/* ===================== TEACHER ===================== */
export const teacherAiAnalytics = asyncHandler(async (req, res) => {
  const teacherUserId = req.user.id;

  const data = await getTeacherAnalytics(teacherUserId);
  res.json(data);
});

/* ===================== STUDENT ===================== */
export const studentAiAnalytics = asyncHandler(async (req, res) => {
  const studentUserId = req.user.id;

  const data = await getStudentDailyUsage(studentUserId);
  res.json(data);
});

export const studentAiInsights = asyncHandler(async (req, res) => {
  const data = await getStudentPersonalizedInsights({
    studentUserId: req.user.id,
    studentId: req.user.student_id,
    schoolId: req.user.school_id,
  });

  res.json(data);
});
