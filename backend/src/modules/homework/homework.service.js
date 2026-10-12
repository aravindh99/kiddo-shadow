import Homework from "./homework.model.js";
import Section from "../sections/section.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Subject from "../subjects/subject.model.js";
import Class from "../classes/classes.model.js";
import Parent from "../parents/parent.model.js";
import Student from "../students/student.model.js";
import User from "../users/user.model.js";
import HomeworkReadStatus from "./homework-read-status.model.js";
import AppError from "../../shared/appError.js";
import { triggerHomeworkNotification } from "../notifications/notification-trigger.service.js";
import { getPagination } from "../../shared/utils/pagination.js";
import { Op } from "sequelize";
import { listApprovedParentLinks } from "../parents/parent.family.service.js";

export const createHomeworkService = async ({
  user,
  school_id,
  class_id,
  section_id,
  teacher_assignment_id,
  homework_date,
  title,
  due_date,
  attachment_url,
  description,
}) => {
  // 1️⃣ Validate section
  const section = await Section.findOne({
    where: { id: section_id, class_id, school_id, is_active: true },
  });

  if (!section) {
    throw new AppError("SECTION_NOT_FOUND", 404);
  }

  // 2️⃣ Validate teacher assignment
  const assignment = await TeacherAssignment.findOne({
    where: {
      id: teacher_assignment_id,
      school_id,
      class_id,
      section_id,
      is_active: true,
    },
    include: [{ model: Subject }],
  });

  if (!assignment) {
    throw new AppError("INVALID_TEACHER_ASSIGNMENT", 400);
  }

  // 3️⃣ Permission check (teacher must own assignment)
  if (user.role === "teacher" && assignment.teacher_id !== user.teacher_id) {
    throw new AppError("FORBIDDEN", 403);
  }

  // 4️⃣ Create homework
  const homework = await Homework.create({
    school_id,
    class_id,
    section_id,
    teacher_assignment_id: assignment.id,
    subject_id: assignment.subject_id, // derived
    homework_date,
    title: title || null,
    due_date: due_date || null,
    attachment_url: attachment_url || null,
    description,
    created_by: user.id,
  });

  // 5️⃣ Notify
  await triggerHomeworkNotification({
    school_id,
    teacher_user_id: user.id,
    class_id,
    section_id,
    subject_name: assignment.subject?.name,
  });

  return homework;
};

export const listHomeworkService = async ({
  user,
  school_id,
  class_id,
  section_id,
  student_id,
  date,
  created_date,
  query,
}) => {
  let { limit, offset } = getPagination(query);

  const where = { school_id };
  const andConditions = [];

  let isActiveHomeworkMode = false;
  const todayStr = new Date().toISOString().split("T")[0];

  if (date) {
    if (date === todayStr) {
      isActiveHomeworkMode = true;
      limit = 100; // Fetch more to ensure deduplication has enough pool
      andConditions.push({
        due_date: {
          [Op.gte]: todayStr
        }
      });
    } else {
      andConditions.push({
        [Op.or]: [
          { homework_date: date },
          { due_date: date }
        ]
      });
    }
  }

  if (created_date) {
    const start = new Date(`${created_date}T00:00:00`);
    const end = new Date(`${created_date}T23:59:59.999`);
    andConditions.push({ created_at: { [Op.between]: [start, end] } });
  }

  let isStudentOrParent = false;

  if (user?.role === "student") {
    where.class_id = user.class_id;
    where.section_id = user.section_id;
    isStudentOrParent = true;
  } else if (user?.role === "parent") {
    const links = await listApprovedParentLinks({
      parent_user_id: user.id,
      school_id,
    });

    const student = links
      .map((link) => link.student ?? link.Student)
      .find((item) => {
        if (!item) return false;
        if (!student_id) return true;
        return Number(item.id) === Number(student_id);
      });

    if (!student) {
      return { count: 0, rows: [] };
    }
    where.class_id = student.class_id;
    where.section_id = student.section_id;
    isStudentOrParent = true;
  } else if (user?.role === "teacher") {
    const assignments = await TeacherAssignment.findAll({
      where: {
        school_id,
        teacher_id: user.teacher_id,
        is_active: true,
      },
      attributes: ["id", "class_id", "section_id", "is_class_teacher"],
    });

    if (!assignments.length) {
      return { count: 0, rows: [] };
    }

    const assignmentIds = assignments.map((a) => a.id);
    const classTeacherSections = assignments
      .filter((a) => a.is_class_teacher)
      .map((a) => ({
        class_id: a.class_id,
        section_id: a.section_id,
      }));

    if (class_id && section_id) {
      const isClassTeacher = classTeacherSections.some(
        (s) =>
          String(s.class_id) === String(class_id) &&
          String(s.section_id) === String(section_id)
      );

      if (isClassTeacher) {
        where.class_id = class_id;
        where.section_id = section_id;
      } else {
        const allowedAssignmentIds = assignments
          .filter(
            (a) =>
              String(a.class_id) === String(class_id) &&
              String(a.section_id) === String(section_id)
          )
          .map((a) => a.id);

        if (!allowedAssignmentIds.length) {
          return { count: 0, rows: [] };
        }
        where.teacher_assignment_id = { [Op.in]: allowedAssignmentIds };
      }
    } else {
      const orConditions = [];
      if (assignmentIds.length) {
        orConditions.push({ teacher_assignment_id: { [Op.in]: assignmentIds } });
      }
      if (classTeacherSections.length) {
        classTeacherSections.forEach((s) => {
          orConditions.push({
            class_id: s.class_id,
            section_id: s.section_id,
          });
        });
      }

      if (!orConditions.length) {
        return { count: 0, rows: [] };
      }
      andConditions.push({ [Op.or]: orConditions });
    }
  } else {
    // school_admin / super_admin: allow optional filters
    if (class_id) where.class_id = class_id;
    if (section_id) where.section_id = section_id;
  }

  if (andConditions.length > 0) {
    where[Op.and] = andConditions;
  }

  // Include models based on role
  const includeModels = [
    { model: Subject, attributes: ["id", "name"] },
    { model: Class, attributes: ["id", "class_name"] },
    { model: Section, attributes: ["id", "name"] },
    { model: User, attributes: ["id", "name", "role"] },
  ];

  if (isStudentOrParent) {
    // Return the read status for this specific student only
    includeModels.push({
      model: HomeworkReadStatus,
      where: {
        student_id: user.role === "student" ? user.student_id : student_id
      },
      required: false, // LEFT JOIN so unread homeworks still appear
    });
  } else {
    // Teachers/Admins: Return all read statuses to see who has read it
    includeModels.push({
      model: HomeworkReadStatus,
      required: false,
    });
    // And include students in the section so the frontend can cross-reference
    // Wait, Section is already included. We just need to load Section.students
    includeModels.find(m => m.model === Section).include = [
      { 
        model: Student, 
        attributes: ["id", "admission_no", "user_id"],
        include: [{ model: User, attributes: ["id", "name", "role"] }]
      }
    ];
  }

  let result = await Homework.findAndCountAll({
    where,
    include: includeModels,
    order: [["homework_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
    distinct: true, // Needed when using hasMany inside findAndCountAll
  });

  if (isActiveHomeworkMode) {
    const latestMap = new Map();
    const finalRows = [];
    
    for (const item of result.rows) {
      const key = `${item.class_id}_${item.section_id}_${item.subject_id || 'no_sub'}`;
      
      if (item.homework_date === todayStr) {
        // Always show all homework created today
        finalRows.push(item);
        // Mark this subject as having an active assignment so older ones are ignored
        if (!latestMap.has(key)) {
          latestMap.set(key, true);
        }
      } else {
        // For past active homework, only keep the latest one per subject
        if (!latestMap.has(key)) {
          latestMap.set(key, true);
          finalRows.push(item);
        }
      }
    }
    
    result.rows = finalRows;
    result.count = finalRows.length;
  }

  return result;
};

export const updateHomeworkService = async ({ id, user, ...data }) => {
  const homework = await Homework.findByPk(id);
  if (!homework) {
    throw new AppError("Homework not found", 404);
  }

  // Allow if school_admin OR created by this user
  if (user.role !== "school_admin" && user.role !== "super_admin" && String(homework.created_by) !== String(user.id)) {
    throw new AppError("Not authorized to update this homework", 403);
  }

  await homework.update({
    ...data,
    title: data.title !== undefined ? data.title : homework.title,
    due_date: data.due_date !== undefined ? data.due_date : homework.due_date,
    attachment_url: data.attachment_url !== undefined ? data.attachment_url : homework.attachment_url,
  });
  return homework;
};

export const deleteHomeworkService = async ({ id, user }) => {
  const homework = await Homework.findByPk(id);
  if (!homework) {
    throw new AppError("Homework not found", 404);
  }

  // Allow if school_admin OR created by this user
  if (user.role !== "school_admin" && user.role !== "super_admin" && String(homework.created_by) !== String(user.id)) {
    throw new AppError("Not authorized to delete this homework", 403);
  }

  await homework.destroy();
  return { success: true };
};

export const markHomeworkAsReadService = async ({ homework_id, user, student_id }) => {
  const targetStudentId = user.role === "student" ? user.student_id : student_id;
  
  if (!targetStudentId) {
    throw new AppError("Student ID is required", 400);
  }

  // Find or create read status
  const [readStatus, created] = await HomeworkReadStatus.findOrCreate({
    where: {
      homework_id,
      student_id: targetStudentId,
    },
    defaults: {
      homework_id,
      student_id: targetStudentId,
      student_read_at: user.role === "student" ? new Date() : null,
      parent_read_at: user.role === "parent" ? new Date() : null,
    },
  });

  // If already exists, just update the relevant timestamp if it's null
  if (!created) {
    let changed = false;
    if (user.role === "student" && !readStatus.student_read_at) {
      readStatus.student_read_at = new Date();
      changed = true;
    } else if (user.role === "parent" && !readStatus.parent_read_at) {
      readStatus.parent_read_at = new Date();
      changed = true;
    }
    if (changed) {
      await readStatus.save();
    }
  }

  return readStatus;
};
