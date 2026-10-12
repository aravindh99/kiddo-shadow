import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import { resolveTeacherId } from "../../shared/utils/resolveTeacherId.js";
import {
  saveTimetableService,
  getSectionTimetableService,
  getTeacherTimetableService,
  approveTimetableService,
} from "./timetable.service.js";

/* TEACHER/ADMIN: SAVE TIMETABLE */
export const saveTimetable = asyncHandler(async (req, res) => {
  await saveTimetableService({
    user: req.user,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.json({
    success: true,
    message: "Timetable saved successfully",
  });
});

/* STUDENT / PARENT: VIEW SECTION TIMETABLE */
export const getSectionTimetable = asyncHandler(async (req, res) => {
  const timetable = await getSectionTimetableService({
    school_id: req.user.school_id,
    class_id: Number(req.query.class_id),
    section_id: Number(req.query.section_id),
  });

  res.json({
    success: true,
    data: timetable,
  });
});

/* TEACHER: VIEW OWN TIMETABLE */
export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const teacherId = await resolveTeacherId(req.user);
  if (!teacherId) {
    throw new AppError("Teacher profile not found", 404);
  }

  const timetable = await getTeacherTimetableService({
    school_id: req.user.school_id,
    teacher_id: [teacherId, req.user.id],
  });

  res.json({
    success: true,
    data: timetable,
  });
});

/* ADMIN: APPROVE TIMETABLE */
export const approveTimetable = asyncHandler(async (req, res) => {
  await approveTimetableService({
    user: req.user,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.json({
    success: true,
    message: "Timetable approval processed successfully",
  });
});

