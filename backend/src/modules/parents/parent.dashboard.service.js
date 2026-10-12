import { getPagination } from "../../shared/utils/pagination.js";
import Timetable from "../timetables/timetable.model.js";
import Homework from "../homework/homework.model.js";
import HomeworkSubmission from "../homework/homework-submission.model.js";
import ReportCard from "../report-cards/report-card.model.js";
import Attendance from "../attendance/attendance.model.js";
import Exam from "../report-cards/exam.model.js";
import { Op } from "sequelize";
import { listApprovedParentLinks } from "./parent.family.service.js";

/* =========================================================
   1️⃣ PARENT → CHILDREN LIST (PROFILE / MANAGEMENT)
   (KEEP THIS – pagination, approvals, profile data)
========================================================= */
export const getParentChildrenService = async ({
  parent_user_id,
  school_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const links = await listApprovedParentLinks({
    parent_user_id,
    school_id,
    includeStudentDetails: true,
  });

  const uniqueLinks = [];
  const seenStudentIds = new Set();

  for (const link of links) {
    const student = link.student ?? link.Student;
    const studentId = Number(student?.id);
    if (!Number.isFinite(studentId) || seenStudentIds.has(studentId)) continue;
    seenStudentIds.add(studentId);
    uniqueLinks.push(link);
  }

  return {
    count: uniqueLinks.length,
    rows: uniqueLinks.slice(offset, offset + limit),
  };
};

/* =========================================================
   2️⃣ PARENT → DAILY DASHBOARD (ACADEMICS)
========================================================= */

const getToday = () => new Date().toISOString().slice(0, 10);

const getDayName = () =>
  new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

export const getParentDailyDashboardService = async ({
  school_id,
  parent_user_id,
  student_id = null,
}) => {
  const links = await listApprovedParentLinks({
    parent_user_id,
    school_id,
  });

  const students = [];
  const seenStudentIds = new Set();

  for (const link of links) {
    const student = link.student ?? link.Student;
    const studentId = Number(student?.id);
    if (!Number.isFinite(studentId) || seenStudentIds.has(studentId)) continue;
    seenStudentIds.add(studentId);
    students.push(student);
  }

  const normalizedStudentId = student_id ? Number(student_id) : null;
  const filteredStudents = normalizedStudentId
    ? students.filter((student) => Number(student.id) === normalizedStudentId)
    : students;

  const today = getToday();
  const day = getDayName();

  const dashboards = [];

  for (const student of filteredStudents) {
    /* -------- Timetable (today) -------- */
    const timetable = await Timetable.findAll({
      where: {
        school_id,
        class_id: student.class_id,
        section_id: student.section_id,
        day_of_week: day,
      },
      order: [["start_time", "ASC"]],
    });

    /* -------- Homework (today) -------- */
    const homework = await Homework.findAll({
      where: {
        school_id,
        class_id: student.class_id,
        section_id: student.section_id,
        homework_date: today,
      },
    });

    const submissions = await HomeworkSubmission.findAll({
      where: {
        student_id: student.id,
        homework_id: homework.map((h) => h.id),
      },
    });

    const submissionMap = {};
    submissions.forEach((s) => {
      submissionMap[s.homework_id] = s;
    });

    const homeworkStatus = homework.map((h) => ({
      homework_id: h.id,
      subject_id: h.subject_id,
      description: h.description,
      is_completed: submissionMap[h.id]?.is_completed ?? false,
    }));

    /* -------- Attendance (last 7 days) -------- */
    const attendance = await Attendance.findAll({
      where: {
        student_id: student.id,
        date: {
          [Op.gte]: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ),
        },
      },
      order: [["date", "DESC"]],
    });

    /* -------- Report Cards (published) -------- */
    const reportCards = await ReportCard.findAll({
      where: {
        student_id: student.id,
        published_at: { [Op.ne]: null },
      },
      include: [{ model: Exam }],
      order: [["published_at", "DESC"]],
      limit: 3,
    });

    dashboards.push({
      student: {
        id: student.id,
        name: (student.user ?? student.User)?.name ?? null,
        roll_no: student.roll_no,
        class_id: student.class_id,
        section_id: student.section_id,
      },
      timetable,
      homework: homeworkStatus,
      attendance_last_7_days: attendance,
      report_cards: reportCards,
    });
  }

  return dashboards;
};
