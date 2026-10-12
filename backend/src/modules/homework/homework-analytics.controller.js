import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  getHomeworkSummaryService,
  getHomeworkStudentStatusService,
} from "./homework-analytics.service.js";

/* TEACHER: SUMMARY */
export const getHomeworkSummary = asyncHandler(async (req, res) => {
  const summary = await getHomeworkSummaryService({
    school_id: req.user.school_id,
    ...req.query,
  });

  res.json({
    success: true,
    data: summary,
  });
});

/* TEACHER: STUDENT STATUS */
export const getHomeworkStudentStatus = asyncHandler(async (req, res) => {
  const data = await getHomeworkStudentStatusService({
    school_id: req.user.school_id,
    homework_id: req.params.homework_id,
  });

  if (!data) {
    throw new AppError("Homework not found", 404);
  }

  res.json({
    success: true,
    data,
  });
});
