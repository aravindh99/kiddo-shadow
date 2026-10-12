import User from "../users/user.model.js";
import Student from "./student.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Parent from "../parents/parent.model.js";
import Attendance from "../attendance/attendance.model.js";
import PaymentLog from "../payment-logs/payment-log.model.js";
import ReportCard from "../report-cards/report-card.model.js";
import ReportCardMark from "../report-cards/report-card-mark.model.js";
import GameSessionPlayer from "../game/game-session-player.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";
import db from "../../config/db.js";
import { getStudentPersonalizedInsights } from "../ai-analytics/ai-analytics.service.js";

/* =========================
   ADMIN:  CREATE STDUENT
========================= */
export const createStudentService = async ({
  school_id,
  class_id,
  section_id,
}) => {
  if (!section_id || !class_id) {
    throw new AppError("class_id and section_id are required", 400);
  }

  return db.transaction(async (t) => {
    /**
     * 1️⃣ Validate section
     */
    const section = await Section.findOne({
      where: {
        id: section_id,
        class_id,
        school_id,
        is_active: true,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!section) {
      throw new AppError("Section not found or inactive", 404);
    }

    /**
     * 2️⃣ Generate serial (school-level, consistent with bulk)
     */
    const baseSerial = await Student.count({
      where: { school_id },
      transaction: t,
    });

    const serial = baseSerial + 1;
    const username = `STU-${school_id}-${section_id}-${String(serial).padStart(3, "0")}`;
    const password = `${username}@123`;

    /**
     * 3️⃣ Ensure username uniqueness
     */
    const exists = await User.findOne({
      where: { school_id, username },
      transaction: t,
    });

    if (exists) {
      throw new AppError("Generated username already exists", 409);
    }

    /**
     * 4️⃣ Create user
     */
    const user = await User.create(
      {
        role: "student",
        school_id,
        username,
        password,
        first_login: true,
        is_active: true,
        name: "Student",
      },
      { transaction: t }
    );

    /**
     * 5️⃣ Create student profile
     */
    const student = await Student.create(
      {
        user_id: user.id,
        school_id,
        class_id,
        section_id,
        admission_no: `ADM-${username}`,
        approval_status: "pending",
        is_active: true,
      },
      { transaction: t }
    );

    /**
     * 6️⃣ Return minimal response
     */
    return {
      student_id: student.id,
      username,
      class_id,
      section_id,
      password_hint: "username@123",
    };
  });
};
/* =========================
   ADMIN: LIST
========================= */


export const listStudentsService = async ({ school_id, query }) => {
  const { limit, offset } = getPagination(query);
  const where = {};

  if (school_id !== undefined && school_id !== null) {
    where.school_id = school_id;
  }

  if (query?.class_id) where.class_id = Number(query.class_id);
  if (query?.section_id) where.section_id = Number(query.section_id);

  const sortMap = {
    id: "id",
    roll_no: "roll_no",
    admission_no: "admission_no",
    created_at: "created_at",
  };
  const sortBy = sortMap[query?.sort] || "created_at";
  const sortOrder =
    String(query?.order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  return Student.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: User, attributes: ["id", "username", "name", "is_active"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    order: [[sortBy, sortOrder]],
  });
};

/* =========================
   ADMIN: OPTIONS (DROPDOWN)
========================= */
export const listStudentOptionsService = async ({ school_id, query }) => {
  const where = { school_id };

  if (query?.class_id) where.class_id = Number(query.class_id);
  if (query?.section_id) where.section_id = Number(query.section_id);

  return Student.findAll({
    where,
    include: [
      { model: User, attributes: ["id", "username", "name", "is_active"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    attributes: ["id", "class_id", "section_id", "roll_no", "admission_no"],
    order: [[User, "username", "ASC"]],
  });
};

// Teacher scoped students (by their assignments)
export const listStudentsForTeacherSectionService = async ({ user, query }) => {
  const assignments = await TeacherAssignment.findAll({
    where: { teacher_id: user.teacher_id, school_id: user.school_id, is_active: true },
    attributes: ["class_id", "section_id"],
  });

  const allowedSectionIds = [...new Set(assignments.map((a) => a.section_id))];
  const allowedClassIds = [...new Set(assignments.map((a) => a.class_id))];

  if (!allowedSectionIds.length) return [];

  const where = {
    school_id: user.school_id,
    section_id: allowedSectionIds,
    class_id: allowedClassIds,
    is_active: true,
  };

  if (query?.class_id) where.class_id = Number(query.class_id);
  if (query?.section_id) where.section_id = Number(query.section_id);

  const students = await Student.findAll({
    where,
    include: [
      { 
        model: User, 
        attributes: ["id", "username", "name", "is_active"],
        where: { is_active: true },
        required: true,
      },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    attributes: ["id", "class_id", "section_id", "roll_no", "admission_no", "is_active"],
    order: [[User, "username", "ASC"]],
  });

  return students;
};

export const getStudentInsightsService = async ({ student_id, user }) => {
  const where = { id: student_id };

  if (user?.role !== "super_admin") {
    where.school_id = user.school_id;
  }

  const student = await Student.findOne({
    where,
    include: [
      { model: User, attributes: ["id", "name", "phone", "email", "avatar_url", "is_active"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (user?.role === "teacher") {
    const assignment = await TeacherAssignment.findOne({
      where: {
        teacher_id: user.teacher_id,
        school_id: user.school_id,
        class_id: student.class_id,
        section_id: student.section_id,
        is_active: true,
      },
    });

    if (!assignment) {
      throw new AppError("Forbidden", 403);
    }
  }

  const parents = await Parent.findAll({
    where: { student_id: student.id },
    include: [{ model: User, attributes: ["id", "name", "phone", "email"] }],
    order: [["created_at", "ASC"]],
  });

  const latestPayment = await PaymentLog.findOne({
    where: { student_id: student.id },
    order: [
      ["payment_date", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  const reportCardIds = await ReportCard.findAll({
    where: { student_id: student.id },
    attributes: ["id"],
  });

  const attendanceLogs = await Attendance.count({
    where: { student_id: student.id },
  });

  const marksEntries = reportCardIds.length
    ? await ReportCardMark.count({
        where: { report_card_id: reportCardIds.map((item) => item.id) },
      })
    : 0;

  const quizAttempts = await GameSessionPlayer.count({
    where: { user_id: student.user_id },
  });
  const personalizedInsights = await getStudentPersonalizedInsights({
    studentUserId: student.user_id,
    studentId: student.id,
    schoolId: student.school_id,
  });

  const primaryParent = parents[0] || null;
  const parentUser = primaryParent?.user || primaryParent?.User || null;
  const dueAmount = latestPayment
    ? Math.max(
        0,
        Number(latestPayment.demand_amount || 0) - Number(latestPayment.paid_amount || 0)
      )
    : 0;

  return {
    student: {
      id: student.id,
      user_id: student.user_id,
      name: student.user?.name || null,
      phone: student.user?.phone || null,
      email: student.user?.email || null,
      avatar_url: student.user?.avatar_url || null,
      admission_no: student.admission_no,
      roll_no: student.roll_no,
      class_id: student.class_id,
      class_name: student.class?.class_name || null,
      section_id: student.section_id,
      section_name: student.section?.name || null,
      is_active: student.is_active,
    },
    parent: {
      relation_type: primaryParent?.relation_type || null,
      name: parentUser?.name || null,
      phone: parentUser?.phone || null,
      email: parentUser?.email || null,
    },
    payment: {
      status: latestPayment?.payment_status || "pending",
      total_due_amount: dueAmount,
      last_payment_date: latestPayment?.payment_date || null,
    },
    snapshot: {
      attendance_logs: attendanceLogs,
      marks_entries: marksEntries,
      quiz_attempts: quizAttempts,
      ai_tests_completed: personalizedInsights?.ai_test_summary?.total_attempted || 0,
      ai_test_average_percentage: personalizedInsights?.ai_test_summary?.average_percentage || 0,
    },
    personalized_insights: personalizedInsights,
  };
};

/* =========================
   ADMIN: MOVE
========================= */
export const moveStudentService = async ({
  student_id,
  section_id,
  school_id,
}) => {
  const student = await Student.findOne({
    where: { id: student_id, school_id },
  });
  if (!student) throw new AppError("Student not found", 404);

  student.section_id = section_id;
  await student.save();
  return student;
};

/* =========================
   ADMIN: STATUS
========================= */
export const updateStudentStatusService = async ({
  student_id,
  is_active,
  school_id,
}) => {
  const student = await Student.findOne({
    where: { id: student_id, school_id },
  });
  if (!student) throw new AppError("Student not found", 404);

  student.is_active = is_active;
  await student.save();
  return student;
};


//Bulk student update to sections

export const assignStudentsToSectionService = async ({
  school_id,
  target_class_id,
  target_section_id,
  students,
}) => {
  return db.transaction(async (t) => {
    // 1. Validate class
    const cls = await Class.findOne({
      where: { id: target_class_id, school_id },
      transaction: t,
    });

    if (!cls) {
      return { error: "CLASS_NOT_FOUND" };
    }

    // 2. Validate section
    const section = await Section.findOne({
      where: {
        id: target_section_id,
        class_id: target_class_id,
        school_id,
        is_active: true,
      },
      transaction: t,
    });

    if (!section) {
      return { error: "SECTION_NOT_FOUND" };
    }

    // Update students
    for (const s of students) {
      await Student.update(
        {
          class_id: target_class_id,
          section_id: target_section_id,
          roll_no: s.roll_no,
        },
        {
          where: {
            id: s.student_id,
            school_id,
          },
          transaction: t,
        }
      );
    }

    return { success: true };
  });
};
