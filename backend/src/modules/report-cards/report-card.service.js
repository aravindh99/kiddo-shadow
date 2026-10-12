import ReportCard from "./report-card.model.js";
import ReportCardMark from "./report-card-mark.model.js";
import Exam from "./exam.model.js";
import Student from "../students/student.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import { triggerReportCardNotification } from "../notifications/notification-trigger.service.js";
import db from "../../config/db.js";
import AppError from "../../shared/appError.js";
import User from "../users/user.model.js";

/* =========================
   CREATE (DRAFT)
========================= */
export const createReportCardService = async ({
  school_id,
  student_id,
  exam_id,
  user,
}) => {
  const exam = await Exam.findOne({
    where: { id: exam_id, school_id },
  });
  if (!exam) throw new AppError("EXAM_NOT_FOUND", 404);

  if (exam.is_locked) throw new AppError("EXAM_LOCKED", 400);

  const student = await Student.findOne({
    where: { id: student_id, school_id },
  });
  if (!student) throw new AppError("STUDENT_NOT_FOUND", 404);

  if (user?.role === "teacher") {
    const assignment = await TeacherAssignment.findOne({
      where: {
        teacher_id: user.teacher_id,
        section_id: student.section_id,
        school_id,
        is_class_teacher: true,
        is_active: true,
      },
    });
    if (!assignment) throw new AppError("FORBIDDEN", 403);
  }

  const exists = await ReportCard.findOne({
    where: { student_id, exam_id, school_id },
  });
  if (exists) throw new AppError("REPORT_CARD_EXISTS", 409);

  const reportCard = await ReportCard.create({
    student_id,
    class_id: student.class_id,
    exam_id,
    school_id,
  });

  return reportCard;
};

/* =========================
   SAVE / UPDATE MARKS
========================= */
export const saveReportCardMarksService = async ({
  report_card_id,
  marks,
  user,
}) => {
  return db.transaction(async (t) => {
    const reportCard = await ReportCard.findByPk(report_card_id, {
      include: [{ model: Student }],
      transaction: t
    });
    if (!reportCard) throw new AppError("REPORT_CARD_NOT_FOUND", 404);
    if (String(reportCard.school_id) !== String(user.school_id)) {
      throw new AppError("FORBIDDEN", 403);
    }

    const exam = await Exam.findByPk(reportCard.exam_id, { transaction: t });
    if (exam?.is_locked) throw new AppError("EXAM_LOCKED", 400);

    // Permission check for teachers
    if (user.role === "teacher") {
      const assignment = await TeacherAssignment.findOne({
        where: {
          teacher_id: user.teacher_id,
          section_id: reportCard.student.section_id,
          school_id: reportCard.school_id,
          is_class_teacher: true,
          is_active: true
        },
        transaction: t
      });
      if (!assignment) throw new AppError("FORBIDDEN", 403);
    }

    // manual overwrite (by design)
    await ReportCardMark.destroy({
      where: { report_card_id },
      transaction: t,
    });

    for (const m of marks) {
      await ReportCardMark.create({
        report_card_id,
        subject_id: m.subject_id,
        marks_obtained: m.marks_obtained,
        max_marks: m.max_marks,
      }, { transaction: t });
    }

    return true;
  });
};

/* =========================
   PUBLISH
========================= */
export const publishReportCardService = async ({
  report_card_id,
  remarks,
  user,
}) => {
  const reportCard = await ReportCard.findByPk(report_card_id, {
    include: [
      {
        model: Student,
        include: [{ model: User, attributes: ["name"] }],
      },
    ],
  });
  if (!reportCard) throw new AppError("REPORT_CARD_NOT_FOUND", 404);
  if (String(reportCard.school_id) !== String(user.school_id)) {
    throw new AppError("FORBIDDEN", 403);
  }

  if (reportCard.published_at) throw new AppError("ALREADY_PUBLISHED", 400);

  const exam = await Exam.findByPk(reportCard.exam_id);
  if (exam?.is_locked) throw new AppError("EXAM_LOCKED", 400);

  // Permission check for teachers
  if (user.role === "teacher") {
    const assignment = await TeacherAssignment.findOne({
      where: {
        teacher_id: user.teacher_id,
        section_id: reportCard.student.section_id,
        school_id: reportCard.school_id,
        is_class_teacher: true,
        is_active: true
      }
    });
    if (!assignment) throw new AppError("FORBIDDEN", 403);
  }

  reportCard.remarks = remarks;
  reportCard.published_at = new Date();
  await reportCard.save();

  // ===== Notification Trigger =====
  const student = reportCard.student;

  if (student) {
    await triggerReportCardNotification({
      school_id: student.school_id,
      teacher_user_id: user.id,
      student_name: (student.user ?? student.User)?.name ?? "Student",
      exam_name: exam?.name || "Exam",
      class_id: student.class_id,
      section_id: student.section_id,
    });
  }

  return reportCard;
};

/* =========================
   VIEW
========================= */
export const getReportCardService = async ({ report_card_id }) => {
  return ReportCard.findByPk(report_card_id, {
    include: [
      {
        model: ReportCardMark,
      },
      {
        model: Exam,
      },
      {
        model: Student,
      },
    ],
  });
};

export const listReportCardsService = async ({ student_id, school_id }) => {
  return toList(ReportCard.findAll({
    where: { student_id, school_id },
    include: [
      {
        model: Exam,
        attributes: ["id", "name", "start_date"],
      },
    ],
    order: [[Exam, "start_date", "DESC"]],
  }));
};

async function toList(promise) {
  const list = await promise;
  return { count: list.length, rows: list };
}
