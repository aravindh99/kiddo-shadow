import asyncHandler from "../../shared/asyncHandler.js";
import * as service from "./teacher-assignment.service.js";
import AppError from "../../shared/appError.js";
import TeacherAssignment from "./teacher-assignment.model.js";
import { resolveTeacherId } from "../../shared/utils/resolveTeacherId.js";

/* ADMIN: CREATE ASSIGNMENT */
export const assignTeacher = asyncHandler(async (req, res) => {
  const assignment = await service.assignTeacher({
    schoolId: req.user.school_id,
    teacherId: req.body.teacher_id,
    classId: req.body.class_id,
    sectionId: req.body.section_id,
    subjectId: req.body.subject_id,
    isClassTeacher: req.body.is_class_teacher,
    academicYear: req.body.academic_year,
  });

  res.status(201).json({
    success: true,
    data: assignment,
  });
});

/* ADMIN: LIST ALL ASSIGNMENTS */
export const listAssignments = asyncHandler(async (req, res) => {
  const result = await service.listAssignments({
    schoolId: req.user.school_id,
    query: req.query,
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows,
  });
});

/* TEACHER/ADMIN: GET TEACHER'S ASSIGNMENTS */
export const getTeacherAssignments = asyncHandler(async (req, res) => {
  const teacherId = req.user.role === "teacher"
    ? [await resolveTeacherId(req.user), req.user.id]
    : req.params.teacherId;

  if (!teacherId || (Array.isArray(teacherId) && !teacherId.some(Boolean))) {
    throw new AppError("teacherId is required", 400);
  }

  const assignments = await service.getTeacherAssignments({
    schoolId: req.user.school_id,
    teacherId,
  });

  res.json({
    success: true,
    data: assignments,
  });
});

/* ADMIN: GET SECTION ASSIGNMENTS */
export const getSectionAssignments = asyncHandler(async (req, res) => {
  if (req.user.role === "teacher") {
    const canManage = await TeacherAssignment.findOne({
      where: {
        school_id: req.user.school_id,
        section_id: req.params.sectionId,
        teacher_id: req.user.teacher_id,
        is_class_teacher: true,
        is_active: true,
      },
    });

    if (!canManage) {
      throw new AppError("FORBIDDEN", 403);
    }
  }

  const assignments = await service.getSectionAssignments({
    schoolId: req.user.school_id,
    sectionId: req.params.sectionId,
    dayOfWeek: req.query.day_of_week,
    startTime: req.query.start_time,
    endTime: req.query.end_time,
    substituteMode: req.query.substitute_mode === 'true'
  });

  res.json({
    success: true,
    data: assignments,
  });
});

/* ADMIN: UPDATE ASSIGNMENT */
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await service.updateAssignment({
    schoolId: req.user.school_id,
    assignmentId: req.params.id,
    updates: req.body,
  });

  res.json({
    success: true,
    data: assignment,
  });
});

/* ADMIN: DELETE ASSIGNMENT */
export const deleteAssignment = asyncHandler(async (req, res) => {
  await service.deleteAssignment({
    schoolId: req.user.school_id,
    assignmentId: req.params.id,
  });

  res.json({
    success: true,
    message: "Teacher assignment removed successfully",
  });
});
