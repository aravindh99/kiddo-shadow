import db from "../../config/db.js";
import User from "../users/user.model.js";
import Teacher from "./teacher.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";
import Student from "../students/student.model.js";
import Attendance from "../attendance/attendance.model.js";
import AITestSubmission from "../ai-test-assignments/ai-test-submission.model.js";
import AITestAssignment from "../ai-test-assignments/ai-test-assignment.model.js";
import Timetable from "../timetables/timetable.model.js";
import { Op } from "sequelize";

/* =========================
   ADMIN: CREATE TEACHER
========================= */
export const createTeacherService = async ({ school_id, class_id, section_id }) => {
  return db.transaction(async (t) => {
    /**
     * 1️⃣ Get next serial (school-level)
     */
    const count = await Teacher.count({
      where: { school_id },
      transaction: t,
    });

    let serial = count + 1;
    let username = `TCH-${school_id}-${String(serial).padStart(3, "0")}`;

    /**
     * 2️⃣ Safety check (extremely unlikely, but correct)
     */
    while (true) {
      const exists = await User.findOne({
        where: { school_id, username },
        transaction: t,
      });
      if (!exists) break;
      serial += 1;
      username = `TCH-${school_id}-${String(serial).padStart(3, "0")}`;
    }

    const password = `${username}@123`;

    /**
     * 3️⃣ Create user
     */
    const user = await User.create(
      {
        role: "teacher",
        school_id,
        username,
        password,
        first_login: true,
        is_active: true,
        name: "Teacher",
      },
      { transaction: t }
    );

    /**
     * 4️⃣ Create teacher profile
     */
    const teacher = await Teacher.create(
      {
        user_id: user.id,
        school_id,
        employee_id: `EMP-${username}`,
        joining_date: new Date(),
        approval_status: "pending",
        is_active: true,
      },
      { transaction: t }
    );

    if (class_id || section_id) {
      const classIdNum = Number(class_id);
      const sectionIdNum = Number(section_id);

      if (!Number.isFinite(classIdNum) || !Number.isFinite(sectionIdNum)) {
        throw new AppError("class_id and section_id are required to assign teacher", 400);
      }

      const [cls, section] = await Promise.all([
        Class.findOne({
          where: { id: classIdNum, school_id },
          transaction: t,
        }),
        Section.findOne({
          where: { id: sectionIdNum, class_id: classIdNum, school_id },
          transaction: t,
        }),
      ]);

      if (!cls) throw new AppError("Class not found", 404);
      if (!section) throw new AppError("Section not found", 404);

      await TeacherAssignment.create(
        {
          school_id,
          teacher_id: teacher.id,
          class_id: classIdNum,
          section_id: sectionIdNum,
          subject_id: null,
          is_active: true,
          is_class_teacher: false,
        },
        { transaction: t }
      );
    }

    /**
     * 5️⃣ Return admin-safe response
     */
    return {
      teacher_id: teacher.id,
      username,
      employee_id: teacher.employee_id,
      password_hint: "username@123",
    };
  });
};
/* =========================
   ADMIN: LIST TEACHERS
========================= */

export const listTeachersService = async ({ school_id, query }) => {
  const { limit, offset } = getPagination(query);

  return Teacher.findAndCountAll({
    where: { school_id },
    limit,
    offset,
    include: [
      {
        model: User,
        attributes: ["id", "username", "name", "is_active"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/* =========================
   ADMIN: OPTIONS (DROPDOWN)
========================= */
export const listTeacherOptionsService = async ({ school_id, day_of_week, start_time, end_time }) => {
  let busyTeacherIds = [];
  if (day_of_week && start_time && end_time) {
    const overlappingTimetables = await Timetable.findAll({
      where: {
        school_id,
        day_of_week,
        start_time: { [Op.lt]: end_time },
        end_time: { [Op.gt]: start_time },
        teacher_assignment_id: { [Op.ne]: null }
      },
      include: [{ model: TeacherAssignment, required: true, attributes: ['teacher_id'] }]
    });
    busyTeacherIds = overlappingTimetables.map(t => t.teacher_assignment.teacher_id);
  }

  const whereClause = { school_id };
  if (busyTeacherIds.length > 0) {
    whereClause.id = { [Op.notIn]: busyTeacherIds };
  }

  return Teacher.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        attributes: ["id", "username", "name", "is_active"],
      },
    ],
    attributes: ["id", "user_id", "employee_id", "approval_status", "is_active"],
    order: [[User, "username", "ASC"]],
  });
};

/* =========================
   ADMIN: LIST TEACHERS BY SECTION
========================= */
export const listTeachersBySectionService = async ({ school_id, section_id }) => {
  const sectionIdNum = Number(section_id);
  if (!Number.isFinite(sectionIdNum)) {
    throw new AppError("Invalid section id", 400);
  }

  const rows = await Teacher.findAll({
    where: { school_id },
    include: [
      {
        model: User,
        attributes: ["id", "username", "name", "is_active"],
      },
      {
        model: TeacherAssignment,
        attributes: ["id", "section_id", "class_id", "subject_id", "is_active"],
        where: {
          school_id,
          section_id: sectionIdNum,
          is_active: true,
        },
        required: true,
      },
    ],
    order: [[User, "username", "ASC"]],
  });

  return rows;
};

/* =========================
   ADMIN: STATUS
========================= */
export const updateTeacherStatusService = async ({
  teacher_id,
  is_active,
  school_id,
}) => {
  const teacher = await Teacher.findOne({
    where: { id: teacher_id, school_id },
  });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  teacher.is_active = is_active;
  await teacher.save();

  await User.update(
    { is_active },
    { where: { id: teacher.user_id } }
  );

  return teacher;
};

export const getTeacherStudentReportsService = async ({ user }) => {
  const assignments = await TeacherAssignment.findAll({
    where: {
      school_id: user.school_id,
      teacher_id: user.teacher_id,
      is_active: true,
    },
    include: [
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    order: [["created_at", "DESC"]],
  });

  const scopePairs = Array.from(
    new Map(
      assignments.map((assignment) => [
        `${assignment.class_id}-${assignment.section_id}`,
        {
          class_id: assignment.class_id,
          section_id: assignment.section_id,
        },
      ])
    ).values()
  );

  if (!scopePairs.length) {
    return { assignments: [], students: [], analytics: [] };
  }

  const students = await Student.findAll({
    where: {
      school_id: user.school_id,
      is_active: true,
    },
    include: [
      { model: User, attributes: ["id", "name", "username"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    order: [[User, "name", "ASC"]],
  });

  const filteredStudents = students.filter((student) =>
    scopePairs.some(
      (scope) =>
        Number(scope.class_id) === Number(student.class_id) &&
        Number(scope.section_id) === Number(student.section_id)
    )
  );

  const studentIds = filteredStudents.map((student) => student.id);
  if (!studentIds.length) {
    return { assignments, students: filteredStudents, analytics: [] };
  }

  const [attendanceRows, aiTestRows] = await Promise.all([
    Attendance.findAll({
      where: {
        student_id: studentIds,
      },
      attributes: ["student_id", "status"],
      raw: true,
    }),
    AITestSubmission.findAll({
      where: {
        school_id: user.school_id,
        student_id: studentIds,
      },
      include: [
        {
          model: AITestAssignment,
          where: {
            teacher_id: user.teacher_id,
            is_active: true,
          },
          attributes: [
            "id",
            "title",
            "subject_name",
            "chapter_name",
            "class_id",
            "section_id",
            "created_at",
            "max_score",
          ],
        },
      ],
      order: [["updated_at", "DESC"]],
    }),
  ]);

  const attendanceMap = new Map();
  attendanceRows.forEach((row) => {
    const key = Number(row.student_id);
    const current = attendanceMap.get(key) || { total: 0, present: 0 };
    current.total += 1;
    if (String(row.status || "").toLowerCase() === "present") {
      current.present += 1;
    }
    attendanceMap.set(key, current);
  });

  const testsByStudent = new Map();
  aiTestRows.forEach((row) => {
    const studentId = Number(row.student_id);
    const bucket = testsByStudent.get(studentId) || [];
    bucket.push(row);
    testsByStudent.set(studentId, bucket);
  });

  const analytics = filteredStudents.map((student) => {
    const history = (testsByStudent.get(Number(student.id)) || [])
      .filter((row) => row.ai_test_assignment)
      .map((row) => {
        const test = row.ai_test_assignment;
        const subject = test.subject_name || "General";
        const score = Number(row.score || 0);
        const maxScore = Number(test.max_score || 0);
        return {
          subject,
          topic: test.chapter_name || test.title || "Assessment",
          score,
          max_score: maxScore,
          marks: Number(row.percentage || 0),
          score_label: maxScore ? `${score}/${maxScore}` : `${score}`,
          date: row.submitted_at || row.updated_at || test.created_at,
          test_title: test.title,
          strongTopics: Array.isArray(row.strong_topics)
            ? row.strong_topics.map((topic) => ({ topic, score: Number(row.percentage || 0) }))
            : [],
          weakTopics: Array.isArray(row.weak_topics)
            ? row.weak_topics.map((topic) => ({ topic, score: Number(row.percentage || 0) }))
            : [],
        };
      });

    const groupedSubjects = Array.from(
      history.reduce((map, item) => {
        const key = item.subject;
        const current = map.get(key) || [];
        current.push(item);
        map.set(key, current);
        return map;
      }, new Map()).entries()
    ).map(([subject, items]) => {
      const average = items.length
        ? Math.round(items.reduce((sum, item) => sum + Number(item.marks || 0), 0) / items.length)
        : 0;

      const groupedTopics = Array.from(
        items.reduce((tmap, item) => {
          const tkey = item.topic;
          const tcurrent = tmap.get(tkey) || [];
          tcurrent.push(item);
          tmap.set(tkey, tcurrent);
          return tmap;
        }, new Map()).entries()
      ).map(([topicName, topicItems]) => {
        const attemptCount = topicItems.length;
        const topicAvg = Math.round(topicItems.reduce((sum, item) => sum + Number(item.marks || 0), 0) / attemptCount);
        const lastAttemptDate = topicItems.reduce((latest, item) => 
          new Date(item.date) > new Date(latest) ? item.date : latest
        , topicItems[0].date);

        let trend = "Stable";
        if (attemptCount > 1) {
          const sorted = [...topicItems].sort((a, b) => new Date(a.date) - new Date(b.date));
          const first = sorted[0].marks;
          const last = sorted[sorted.length - 1].marks;
          if (last > first + 5) trend = "Improving";
          else if (last < first - 5) trend = "Declining";
        }

        return {
          topic: topicName,
          subject,
          score: topicAvg,
          attemptCount,
          lastAttemptDate,
          trend,
          aiChatScore: "N/A",
          classTestScore: "N/A",
          assignmentScore: "N/A",
          teacherRecommendation: "",
          aiRecommendation: topicAvg >= 80 
            ? "Excellent grasp of this topic. Ready for advanced challenges." 
            : topicAvg < 50 
              ? "Needs significant review. Recommend focused practice sessions." 
              : "Steady progress. Encourage consistent practice.",
        };
      });

      return {
        subject,
        marks: average,
        strongTopics: groupedTopics.filter(t => t.score >= 80).sort((a, b) => b.score - a.score),
        weakTopics: groupedTopics.filter(t => t.score < 50).sort((a, b) => a.score - b.score),
      };
    });

    const overallAverage = groupedSubjects.length
      ? Math.round(groupedSubjects.reduce((sum, item) => sum + Number(item.marks || 0), 0) / groupedSubjects.length)
      : 0;

    const attendance = attendanceMap.get(Number(student.id));
    const attendancePct = attendance?.total ? Math.round((attendance.present / attendance.total) * 100) : 0;
    const weakSubjects = groupedSubjects.filter((item) => item.marks < 40);
    const strongSubjects = groupedSubjects.filter((item) => item.marks >= 75);
    const weakTopics = groupedSubjects.flatMap((item) =>
      (item.weakTopics || []).map((topic) => ({ ...topic, subject: item.subject }))
    );

    return {
      studentId: Number(student.id),
      name: student.user?.name || student.User?.name || student.user?.username || student.User?.username || `Student ${student.id}`,
      username: student.user?.username || student.User?.username || student.admission_no || `STU-${student.id}`,
      className: student.class?.class_name || student.Class?.class_name || "",
      sectionName: student.section?.name || student.Section?.name || "",
      overallAverage,
      attendancePct,
      subjectSummaries: groupedSubjects,
      weakSubjects,
      strongSubjects,
      weakTopics,
      assessmentHistory: history.sort((a, b) => new Date(b.date) - new Date(a.date)),
      badge: overallAverage >= 85 ? "Top Performer" : overallAverage < 40 || attendancePct < 75 ? "Needs Improvement" : null,
      source: "server",
    };
  });

  return {
    assignments,
    students: filteredStudents,
    analytics,
  };
};
