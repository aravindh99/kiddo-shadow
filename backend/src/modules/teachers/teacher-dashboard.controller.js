import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import { resolveTeacherId } from "../../shared/utils/resolveTeacherId.js";
import { getTeacherDashboardService } from "./teacher-dashboard.service.js";

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacherId = await resolveTeacherId(req.user);
  if (!teacherId) {
    throw new AppError("Teacher profile not found", 404);
  }

  const data = await getTeacherDashboardService({
    school_id: req.user.school_id,
    teacher_id: [teacherId, req.user.id],
    user_id: req.user.id,
  });

  res.json({
    success: true,
    data,
  });
});
