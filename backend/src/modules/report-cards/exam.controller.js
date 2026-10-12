import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import { triggerExamNotification } from "../notifications/notification-trigger.service.js";
import {
  createExamService,
  lockExamService,
  listExamsByClassService,
  addTimetableEntryService,
  listExamTimetableService,
} from "./exam.service.js";

export const createExam = asyncHandler(async (req, res) => {
  const exam = await createExamService({
    school_id: req.user.school_id,
    ...req.body,
  });

  await triggerExamNotification({
    school_id: req.user.school_id,
    sender_user_id: req.user.id,
    sender_role: req.user.role,
    exam_name: exam.name,
    class_id: exam.class_id,
    start_date: exam.start_date,
    end_date: exam.end_date,
  });

  res.status(201).json({
    success: true,
    data: exam,
  });
});

export const lockExam = asyncHandler(async (req, res) => {
  const exam = await lockExamService({
    exam_id: Number(req.params.id),
    school_id: req.user.school_id,
  });

  res.json({
    success: true,
    data: exam,
  });
});

export const listExamsByClass = asyncHandler(async (req, res) => {
  const school_id = req.user.school_id;
  let class_id = req.query.class_id ? Number(req.query.class_id) : null;

  if (!class_id && req.user.role === "student") {
    const student = await Student.findOne({
      where: { user_id: req.user.id, school_id },
      attributes: ["class_id"],
    });
    class_id = student?.class_id || null;
  }

  if (!class_id && req.user.role === "parent") {
    const link = await Parent.findOne({
      where: { user_id: req.user.id, approval_status: "approved" },
      attributes: ["student_id"],
    });
    if (link?.student_id) {
      const student = await Student.findOne({
        where: { id: link.student_id, school_id },
        attributes: ["class_id"],
      });
      class_id = student?.class_id || null;
    }
  }

  // Remove throw AppError("CLASS_ID_REQUIRED", 400);

  const result = await listExamsByClassService({
    school_id,
    class_id,
    query: req.query,
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows,
  });
});

export const addTimetableEntry = asyncHandler(async (req, res) => {
  const data = await addTimetableEntryService({
    exam_id: Number(req.params.id),
    school_id: req.user.school_id,
    entries: req.body.entries,
  });

  res.json({
    success: true,
    data,
  });
});

export const listExamTimetable = asyncHandler(async (req, res) => {
  const data = await listExamTimetableService({
    exam_id: Number(req.params.id),
    school_id: req.user.school_id,
  });

  res.json({
    success: true,
    data,
  });
});
