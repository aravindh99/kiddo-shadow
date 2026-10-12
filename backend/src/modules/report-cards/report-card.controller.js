import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createReportCardService,
  saveReportCardMarksService,
  publishReportCardService,
  getReportCardService,
  listReportCardsService,
} from "./report-card.service.js";

/* TEACHER: CREATE */
export const createReportCard = asyncHandler(async (req, res) => {
  const reportCard = await createReportCardService({
    school_id: req.user.school_id,
    user: req.user,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: reportCard,
  });
});

/* TEACHER: SAVE MARKS */
export const saveReportCardMarks = asyncHandler(async (req, res) => {
  await saveReportCardMarksService({
    report_card_id: Number(req.params.id),
    marks: req.body.marks,
    user: req.user,
  });

  res.json({
    success: true,
    message: "Marks saved",
  });
});

/* TEACHER: PUBLISH */
export const publishReportCard = asyncHandler(async (req, res) => {
  const reportCard = await publishReportCardService({
    report_card_id: Number(req.params.id),
    remarks: req.body.remarks,
    user: req.user,
  });

  res.json({
    success: true,
    data: reportCard,
  });
});

/* VIEW (student / parent / teacher) */
export const getReportCard = asyncHandler(async (req, res) => {
  const reportCard = await getReportCardService({
    report_card_id: req.params.id,
  });

  if (!reportCard || !reportCard.published_at) {
    throw new AppError("Report card not available", 404);
  }

  // school scope (super_admin bypass)
  if (
    req.user.role !== "super_admin" &&
    String(reportCard.school_id) !== String(req.user.school_id)
  ) {
    throw new AppError("Forbidden", 403);
  }

  const student = reportCard.student || reportCard.Student;

  if (req.user.role === "student") {
    if (!student || student.user_id !== req.user.id) {
      throw new AppError("Forbidden", 403);
    }
  }

  if (req.user.role === "parent") {
    const Parent = (await import("../parents/parent.model.js")).default;
    const link = await Parent.findOne({
      where: {
        user_id: req.user.id,
        student_id: reportCard.student_id,
        approval_status: "approved",
      },
    });

    if (!link) {
      throw new AppError("Forbidden", 403);
    }
  }

  if (req.user.role === "teacher") {
    const TeacherAssignment = (
      await import("../teacher-assignments/teacher-assignment.model.js")
    ).default;

    const assignment = await TeacherAssignment.findOne({
      where: {
        teacher_id: req.user.teacher_id,
        section_id: student?.section_id,
        school_id: reportCard.school_id,
        is_class_teacher: true,
        is_active: true,
      },
    });

    if (!assignment) {
      throw new AppError("Forbidden", 403);
    }
  }

  res.json({
    success: true,
    data: reportCard,
  });
});

export const listReportCards = asyncHandler(async (req, res) => {
  if (!req.user.student_id) {
    throw new AppError("Student profile not found", 404);
  }

  const result = await listReportCardsService({
    student_id: req.user.student_id,
    school_id: req.user.school_id,
  });

  res.json({
    success: true,
    data: result.rows,
  });
});
