import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createHomeworkService,
  listHomeworkService,
  updateHomeworkService,
  deleteHomeworkService,
  markHomeworkAsReadService,
} from "./homework.service.js";
import {
  getHomeworkSummaryService,
  getHomeworkStudentStatusService,
} from "./homework-analytics.service.js";

/* TEACHER: CREATE */
export const createHomework = asyncHandler(async (req, res) => {
  const homework = await createHomeworkService({
    user: req.user,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: homework,
  });
});

/* TEACHER: UPDATE */
export const updateHomework = asyncHandler(async (req, res) => {
  const homework = await updateHomeworkService({
    id: req.params.id,
    user: req.user,
    ...req.body,
  });

  res.json({
    success: true,
    data: homework,
  });
});

/* TEACHER: DELETE */
export const deleteHomework = asyncHandler(async (req, res) => {
  await deleteHomeworkService({
    id: req.params.id,
    user: req.user,
  });

  res.json({
    success: true,
    message: "Homework deleted successfully",
  });
});

/* LIST (teacher / parent / student) */
export const listHomework = asyncHandler(async (req, res) => {
  const result = await listHomeworkService({
    user: req.user,
    school_id: req.user.school_id,
    ...req.query,
    query: req.query,
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows,
  });
});
export const getHomeworkSummary = asyncHandler(async (req, res) => {
  const data = await getHomeworkSummaryService({
    school_id: req.user.school_id,
    class_id: req.query.class_id ? Number(req.query.class_id) : undefined,
    section_id: req.query.section_id ? Number(req.query.section_id) : undefined,
    date: req.query.date,
  });

  res.json({ success: true, data });
});

export const getHomeworkStudentStatus = asyncHandler(async (req, res) => {
  const data = await getHomeworkStudentStatusService({
    school_id: req.user.school_id,
    homework_id: Number(req.params.homework_id),
  });

  if (!data) {
    throw new AppError("HOMEWORK_NOT_FOUND", 404);
  }

  res.json({ success: true, data });
});

export const markHomeworkAsRead = asyncHandler(async (req, res) => {
  const result = await markHomeworkAsReadService({
    homework_id: req.params.id,
    user: req.user,
    student_id: req.body.student_id,
  });

  res.json({
    success: true,
    data: result,
  });
});
