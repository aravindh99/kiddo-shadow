import Homework from "./homework.model.js";
import HomeworkSubmission from "./homework-submission.model.js";
import Student from "../students/student.model.js";
import { Op } from "sequelize";
import User from "../users/user.model.js";

export const getHomeworkSummaryService = async ({
  school_id,
  class_id,
  section_id,
  date,
}) => {
  const where = { school_id };

  if (class_id) where.class_id = class_id;
  if (section_id) where.section_id = section_id;
  if (date) where.homework_date = date;

  const homeworks = await Homework.findAll({
    where,
    order: [["homework_date", "DESC"]],
  });

  const results = [];

  for (const hw of homeworks) {
    const totalStudents = await Student.count({
      where: {
        school_id,
        class_id: hw.class_id,
        section_id: hw.section_id,
        is_active: true,
      },
    });

    const completedCount = await HomeworkSubmission.count({
      where: {
        homework_id: hw.id,
        is_completed: true,
      },
    });

    results.push({
      homework_id: hw.id,
      homework_date: hw.homework_date,
      subject_id: hw.subject_id,
      description: hw.description,
      total_students: totalStudents,
      completed: completedCount,
      pending: totalStudents - completedCount,
    });
  }

  return results;
};

export const getHomeworkStudentStatusService = async ({
  school_id,
  homework_id,
}) => {
  const homework = await Homework.findOne({
    where: { id: homework_id, school_id },
  });

  if (!homework) {
    return null;
  }

  const students = await Student.findAll({
    where: {
      school_id,
      class_id: homework.class_id,
      section_id: homework.section_id,
      is_active: true,
    },
    attributes: ["id", "roll_no"],
    include: [{ model: User, attributes: ["name"] }],
  });

  const submissions = await HomeworkSubmission.findAll({
    where: { homework_id },
  });

  const submissionMap = {};
  submissions.forEach((s) => {
    submissionMap[s.student_id] = s;
  });

  return students.map((student) => ({
    student_id: student.id,
    name: (student.user ?? student.User)?.name ?? null,
    roll_no: student.roll_no,
    is_completed: submissionMap[student.id]?.is_completed ?? false,
    remark: submissionMap[student.id]?.remark ?? null,
  }));
};
