import { Op, fn, col, literal } from "sequelize";
import Attendance from "./attendance.model.js";
import Parent from "../parents/parent.model.js";
import AppError from "../../shared/appError.js";
import TeacherClassSession from "../teacher-class-sessions/teacher-class-session.model.js";
import { listApprovedParentLinks } from "../parents/parent.family.service.js";

/* =========================
   TEACHER: ANALYTICS
========================= */
export const getTeacherAttendanceAnalyticsService = async ({
  school_id,
  query,
  teacher_id,
}) => {
  const { from_date, to_date, class_id, section_id, student_id } = query || {};

  const where = { school_id };

  if (class_id) where.class_id = Number(class_id);
  if (section_id) where.section_id = Number(section_id);
  if (student_id) where.student_id = Number(student_id);

  if (from_date || to_date) {
    where.date = {};
    if (from_date) where.date[Op.gte] = from_date;
    if (to_date) where.date[Op.lte] = to_date;
  }

  if (teacher_id) {
    const sessions = await TeacherClassSession.findAll({
      where: { school_id, teacher_id },
      attributes: ["id"],
    });
    const sessionIds = sessions.map((s) => s.id);
    if (!sessionIds.length) return [];
    where.teacher_class_session_id = { [Op.in]: sessionIds };
  }

  const stats = await Attendance.findAll({
    where,
    attributes: [
      "student_id",
      [fn("COUNT", col("id")), "total_days"],
      [fn("SUM", literal(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), "present_days"],
      [fn("SUM", literal(`CASE WHEN status = 'absent' THEN 1 ELSE 0 END`)), "absent_days"],
      [fn("SUM", literal(`CASE WHEN status = 'leave' THEN 1 ELSE 0 END`)), "leave_days"],
    ],
    group: ["student_id"],
  });

  return stats.map((row) => {
    const total = Number(row.get("total_days"));
    const present = Number(row.get("present_days"));

    return {
      student_id: row.student_id,
      total_days: total,
      present_days: present,
      absent_days: Number(row.get("absent_days")),
      leave_days: Number(row.get("leave_days")),
      attendance_percentage: total
        ? Number(((present / total) * 100).toFixed(2))
        : 0,
    };
  });
};

/* =========================
   PARENT: ANALYTICS
========================= */
export const getParentAttendanceAnalyticsService = async ({
  parent_user_id,
  school_id,
  query,
}) => {
  const { from_date, to_date, student_id } = query || {};

  const links = await listApprovedParentLinks({
    parent_user_id,
    school_id,
  });

  let studentIds = links
    .map((l) => Number(l.student_id))
    .filter(Number.isFinite);
  if (student_id) {
    studentIds = studentIds.filter((id) => Number(id) === Number(student_id));
  }
  if (!studentIds.length) return [];

  const where = {
    student_id: studentIds,
  };

  if (from_date || to_date) {
    where.date = {};
    if (from_date) where.date[Op.gte] = from_date;
    if (to_date) where.date[Op.lte] = to_date;
  }

  const stats = await Attendance.findAll({
    where,
    attributes: [
      "student_id",
      [fn("COUNT", col("id")), "total_days"],
      [fn("SUM", literal(`CASE WHEN status = 'present' THEN 1 ELSE 0 END`)), "present_days"],
      [fn("SUM", literal(`CASE WHEN status = 'absent' THEN 1 ELSE 0 END`)), "absent_days"],
      [fn("SUM", literal(`CASE WHEN status = 'leave' THEN 1 ELSE 0 END`)), "leave_days"],
    ],
    group: ["student_id"],
  });

  return stats.map((row) => {
    const total = Number(row.get("total_days"));
    const present = Number(row.get("present_days"));

    return {
      student_id: row.student_id,
      total_days: total,
      present_days: present,
      absent_days: Number(row.get("absent_days")),
      leave_days: Number(row.get("leave_days")),
      attendance_percentage: total
        ? Number(((present / total) * 100).toFixed(2))
        : 0,
    };
  });
};
