import { Op } from "sequelize";
import Attendance from "./attendance.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";
import TeacherClassSession from "../teacher-class-sessions/teacher-class-session.model.js";
import { listApprovedParentLinks } from "../parents/parent.family.service.js";
import { triggerAttendanceNotification } from "../notifications/notification-trigger.service.js";
import Timetable from "../timetables/timetable.model.js";
import Subject from "../subjects/subject.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";

/* =========================
   TEACHER: MARK ATTENDANCE
========================= */
export const markAttendanceService = async ({
  user,
  teacher_id,
  school_id,
  teacher_class_session_id,
  records, // [{ student_id, status }]
}) => {
  const normalizedSessionId = Number(teacher_class_session_id);
  const normalizedTeacherId = Number(teacher_id);

  const session = await TeacherClassSession.findOne({
    where: {
      id: normalizedSessionId,
      school_id,
    },
    include: [
      {
        model: TeacherAssignment,
        include: [{ model: Subject, required: false }],
        required: false,
      },
    ],
  });

  if (!session) {
    throw new AppError("SESSION_NOT_ACTIVE", 400);
  }

  if (session.ended_at) {
    throw new AppError("Attendance Saved / Closed", 400);
  }

  // Prevent duplicate submissions for the same period
  const existingAttendanceCount = await Attendance.count({
    where: { teacher_class_session_id: normalizedSessionId },
  });

  if (existingAttendanceCount > 0) {
    throw new AppError("Attendance Already Submitted", 400);
  }

  if (user.role === "teacher" && Number(session.teacher_id) !== normalizedTeacherId) {
    throw new AppError("FORBIDDEN", 403);
  }

  const attendanceDate = session.started_at
    ? new Date(session.started_at)
    : new Date();

  const requestedIds = [
    ...new Set(
      (records || [])
        .map((r) => Number(r?.student_id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  const enrolledStudents = requestedIds.length
    ? await Student.findAll({
        where: {
          school_id,
          class_id: session.class_id,
          section_id: session.section_id,
          is_active: true,
          [Op.or]: [{ id: requestedIds }, { user_id: requestedIds }],
        },
        attributes: ["id", "user_id"],
      })
    : [];

  const studentIdMap = new Map();
  const studentUserMap = new Map();
  for (const student of enrolledStudents) {
    const sid = Number(student.id);
    const uid = Number(student.user_id);
    if (Number.isInteger(sid) && sid > 0) {
      studentIdMap.set(sid, sid);
      studentUserMap.set(sid, uid);
    }
    if (Number.isInteger(uid) && uid > 0) {
      studentIdMap.set(uid, sid);
      studentUserMap.set(uid, uid);
    }
  }

  let saved = 0;
  const skipped = [];

  for (const { student_id, status } of records || []) {
    const rawId = Number(student_id);
    const resolvedStudentId = studentIdMap.get(rawId);

    if (!resolvedStudentId) {
      skipped.push(student_id);
      continue;
    }

    await Attendance.upsert({
      school_id,
      teacher_class_session_id: normalizedSessionId,
      class_id: session.class_id,
      section_id: session.section_id,
      student_id: resolvedStudentId,
      date: attendanceDate,
      status,
      marked_by: user.id,
    });
    saved += 1;
  }

  if (saved === 0) {
    throw new AppError("No valid students found for this class session", 400);
  }

  // 1. Auto-end the session so the next period becomes available
  session.ended_at = new Date();
  await session.save();

  // 2. Trigger individual attendance notifications
  const subjectName = session.teacher_assignment?.subject?.name || "the scheduled class";
  await triggerAttendanceNotification({
    school_id,
    teacher_id: normalizedTeacherId,
    subject_name: subjectName,
    class_id: session.class_id,
    section_id: session.section_id,
    attendanceDate,
    records,
    studentUserMap,
  });

  return {
    message: "Attendance marked successfully",
    saved,
    skipped,
  };
};

/* =========================
   TEACHER: ATTENDANCE SUMMARY
========================= */
export const getTeacherAttendanceSummaryService = async ({
  school_id,
  query,
  teacher_id,
}) => {
  const { limit, offset } = getPagination(query);
  const { from_date, to_date, class_id, section_id } = query || {};

  const sessionWhere = { school_id };

  if (class_id) sessionWhere.class_id = Number(class_id);
  if (section_id) sessionWhere.section_id = Number(section_id);
  if (teacher_id) sessionWhere.teacher_id = teacher_id;

  if (from_date || to_date) {
    sessionWhere.started_at = {};
    if (from_date) sessionWhere.started_at[Op.gte] = from_date;
    if (to_date) sessionWhere.started_at[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    include: [
      {
        model: TeacherClassSession,
        where: sessionWhere,
      },
      {
        model: Student,
        include: [{ model: User, attributes: ["id", "name"] }],
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

/* =========================
   PARENT: ATTENDANCE SUMMARY
========================= */
export const getParentAttendanceSummaryService = async ({
  parent_user_id,
  school_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
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
  if (!studentIds.length) return { count: 0, rows: [] };

  const sessionWhere = {};

  if (from_date || to_date) {
    sessionWhere.started_at = {};
    if (from_date) sessionWhere.started_at[Op.gte] = from_date;
    if (to_date) sessionWhere.started_at[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    where: { student_id: studentIds },
    include: [
      {
        model: TeacherClassSession,
        where: sessionWhere,
      },
      {
        model: Student,
        include: [{ model: User, attributes: ["id", "name"] }],
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

/* =========================
   STUDENT: ATTENDANCE SUMMARY
========================= */
export const getStudentAttendanceSummaryService = async ({
  student_user_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const { from_date, to_date } = query || {};

  const student = await Student.findOne({ where: { user_id: student_user_id } });
  if (!student) throw new AppError("Student profile not found", 404);

  const sessionWhere = {};

  if (from_date || to_date) {
    sessionWhere.started_at = {};
    if (from_date) sessionWhere.started_at[Op.gte] = from_date;
    if (to_date) sessionWhere.started_at[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    where: { student_id: student.id },
    include: [
      {
        model: TeacherClassSession,
        where: sessionWhere,
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};
