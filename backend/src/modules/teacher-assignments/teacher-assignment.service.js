import TeacherAssignment from "./teacher-assignment.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";
import { Op } from "sequelize";
import db from "../../config/db.js";
import Teacher from "../teachers/teacher.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Subject from "../subjects/subject.model.js";
import User from "../users/user.model.js";
import Timetable from "../timetables/timetable.model.js";


/* CREATE */
export async function assignTeacher({
  schoolId,
  teacherId,
  classId,
  sectionId,
  subjectId,
  isClassTeacher = false,
  academicYear = "2025-2026",
}) {
  return db.transaction(async (transaction) => {
    const [teacher, cls, section, subject] = await Promise.all([
      Teacher.findOne({
        where: {
          school_id: schoolId,
          id: teacherId,
        },
        transaction,
        lock: transaction.LOCK?.SHARE,
      }),
      Class.findOne({ where: { id: classId, school_id: schoolId }, transaction }),
      Section.findOne({
        where: { id: sectionId, class_id: classId, school_id: schoolId, is_active: true },
        transaction,
      }),
      Subject.findOne({ where: { id: subjectId, school_id: schoolId }, transaction }),
    ]);

    if (!teacher) {
      throw new AppError("TEACHER_NOT_FOUND", 404);
    }
    if (!cls) {
      throw new AppError("CLASS_NOT_FOUND", 404);
    }
    if (!section) {
      throw new AppError("SECTION_NOT_FOUND", 404);
    }
    if (!subject) {
      throw new AppError("SUBJECT_NOT_FOUND", 404);
    }

    // Check for existing assignment (same teacher + section + subject in same school)
    // Note: we still do this check for a fast, friendly 409. DB uniqueness also protects against races.
    const exists = await TeacherAssignment.findOne({
      where: {
        school_id: schoolId,
        teacher_id: teacher.id,
        class_id: classId,
        section_id: sectionId,
        subject_id: subjectId,
        academic_year: academicYear,
        is_active: true,
      },
      transaction,
      lock: transaction.LOCK?.UPDATE,
    });

    if (exists) {
      throw new AppError(
        "Teacher already assigned to this subject in this section",
        409
      );
    }

    const currentSubjectCount = await TeacherAssignment.count({
      where: {
        school_id: schoolId,
        teacher_id: teacher.id,
        section_id: sectionId,
        academic_year: academicYear,
        is_active: true,
      },
      transaction,
    });

    if (currentSubjectCount >= 2) {
      throw new AppError(
        "A teacher can only be assigned to a maximum of 2 subjects in the same class.",
        409
      );
    }

    // If trying to set as class teacher, check if section already has a class teacher
    if (isClassTeacher) {
      const existingClassTeacher = await TeacherAssignment.findOne({
        where: {
          school_id: schoolId,
          section_id: sectionId,
          is_class_teacher: true,
          is_active: true,
        },
        transaction,
        lock: transaction.LOCK?.UPDATE,
      });

      if (existingClassTeacher) {
        throw new AppError(
          "This section already has a class teacher assigned",
          409
        );
      }
    }

    try {
      return await TeacherAssignment.create(
        {
          school_id: schoolId,
          teacher_id: teacher.id,
          class_id: classId,
          section_id: sectionId,
          subject_id: subjectId,
          academic_year: academicYear,
          is_class_teacher: isClassTeacher,
        },
        { transaction }
      );
    } catch (err) {
      if (err?.name === "SequelizeUniqueConstraintError") {
        throw new AppError(
          "Teacher already assigned to this subject in this section",
          409
        );
      }
      throw err;
    }
  });
}

/* LIST ALL (with pagination) */
export async function listAssignments({ schoolId, query }) {
  const { limit, offset } = getPagination(query);

  const whereClause = {
    school_id: schoolId,
    is_active: true,
  };

  if (query.subject_id) whereClause.subject_id = query.subject_id;
  if (query.class_id) whereClause.class_id = query.class_id;
  if (query.section_id) whereClause.section_id = query.section_id;

  let busyTeacherIds = [];
  if (query.day_of_week && query.start_time && query.end_time) {
    const overlappingTimetables = await Timetable.findAll({
      where: {
        school_id: schoolId,
        day_of_week: query.day_of_week,
        start_time: { [Op.lt]: query.end_time },
        end_time: { [Op.gt]: query.start_time },
        teacher_assignment_id: { [Op.ne]: null }
      },
      attributes: ['teacher_assignment_id']
    });

    const busyAssignmentIds = overlappingTimetables.map(t => t.teacher_assignment_id);

    if (busyAssignmentIds.length > 0) {
      const busyAssignments = await TeacherAssignment.findAll({
        where: { id: { [Op.in]: busyAssignmentIds } },
        attributes: ['teacher_id']
      });
      busyTeacherIds = busyAssignments.map(a => a.teacher_id);
    }
  }

  if (busyTeacherIds.length > 0) {
    whereClause.teacher_id = { [Op.notIn]: busyTeacherIds };
  }

  return TeacherAssignment.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    include: [
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
      { model: Subject, attributes: ["id", "name"] },
      {
        model: Teacher,
        attributes: ["id", "user_id"],
        include: [{ model: User, attributes: ["id", "name", "username"] }],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

/* LIST BY TEACHER */
export async function getTeacherAssignments({ schoolId, teacherId }) {
  const teacherIds = Array.isArray(teacherId) ? teacherId : [teacherId];
  return TeacherAssignment.findAll({
    where: {
      school_id: schoolId,
      teacher_id: { [Op.in]: teacherIds.filter(Boolean) },
      is_active: true,
    },
    include: [
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
      { model: Subject, attributes: ["id", "name"] },
      {
        model: Teacher,
        attributes: ["id", "user_id"],
        include: [{ model: User, attributes: ["id", "name", "username"] }],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

/* LIST BY SECTION (OR GET FREE/BUSY TEACHERS) */
export async function getSectionAssignments({ schoolId, sectionId, dayOfWeek, startTime, endTime, substituteMode }) {
  const whereClause = {
    school_id: schoolId,
    section_id: sectionId,
    is_active: true,
  };

  // 1. If not substituteMode, just return the standard section assignments
  if (!substituteMode) {
    return TeacherAssignment.findAll({
      where: whereClause,
      include: [
        { model: Class, attributes: ["id", "class_name"] },
        { model: Section, attributes: ["id", "name"] },
        { model: Subject, attributes: ["id", "name"] },
        {
          model: Teacher,
          attributes: ["id", "user_id"],
          include: [{ model: User, attributes: ["id", "name", "username"] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  // 2. If substituteMode, we fetch ALL active teacher assignments for THIS section
  const allAssignments = await TeacherAssignment.findAll({
    where: whereClause,
    include: [
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
      { model: Subject, attributes: ["id", "name"] },
      {
        model: Teacher,
        attributes: ["id", "user_id"],
        include: [{ model: User, attributes: ["id", "name", "username"] }],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Deduplicate by teacher_id so we get exactly one entry per teacher
  const uniqueTeachers = new Map();
  for (const assignment of allAssignments) {
    // Optional: could prefer assignments that match the current section's subject, but first one is fine.
    if (!uniqueTeachers.has(assignment.teacher_id)) {
      uniqueTeachers.set(assignment.teacher_id, assignment.toJSON());
    }
  }

  const teacherList = Array.from(uniqueTeachers.values());

  // 3. Find overlapping timetables to mark teachers as busy
  if (dayOfWeek && startTime && endTime) {
    const overlappingTimetables = await Timetable.findAll({
      where: {
        school_id: schoolId,
        day_of_week: dayOfWeek,
        start_time: { [Op.lt]: endTime },
        end_time: { [Op.gt]: startTime },
        teacher_assignment_id: { [Op.ne]: null }
      },
      include: [
        {
          model: TeacherAssignment,
          attributes: ['teacher_id'],
        },
        { model: Class, attributes: ["class_name"] },
        { model: Section, attributes: ["name"] }
      ]
    });

    const busyMap = new Map();
    for (const tt of overlappingTimetables) {
      if (tt.teacher_assignment && tt.teacher_assignment.teacher_id) {
        busyMap.set(tt.teacher_assignment.teacher_id, {
          class_name: tt.Class?.class_name,
          section_name: tt.Section?.name,
          start_time: tt.start_time,
          end_time: tt.end_time
        });
      }
    }

    // Attach busy status
    for (const t of teacherList) {
      if (busyMap.has(t.teacher_id)) {
        t.is_busy = true;
        t.busy_details = busyMap.get(t.teacher_id);
      } else {
        t.is_busy = false;
      }
    }

    // Sort: Free teachers first, busy teachers second
    teacherList.sort((a, b) => {
      if (a.is_busy === b.is_busy) {
        // Alphabetical sort by teacher name if same status
        const nameA = a.Teacher?.User?.name || "";
        const nameB = b.Teacher?.User?.name || "";
        return nameA.localeCompare(nameB);
      }
      return a.is_busy ? 1 : -1;
    });
  }

  return teacherList;
}

/* UPDATE */
export async function updateAssignment({ schoolId, assignmentId, updates }) {
  const assignment = await TeacherAssignment.findOne({
    where: {
      id: assignmentId,
      school_id: schoolId,
    },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  const nextTeacherId = updates.teacher_id ?? assignment.teacher_id;
  const nextClassId = updates.class_id ?? assignment.class_id;
  const nextSectionId = updates.section_id ?? assignment.section_id;
  const nextSubjectId = updates.subject_id ?? assignment.subject_id;
  const nextAcademicYear = updates.academic_year ?? assignment.academic_year;

  if (
    updates.teacher_id !== undefined ||
    updates.class_id !== undefined ||
    updates.section_id !== undefined ||
    updates.subject_id !== undefined
  ) {
    const [teacher, cls, section, subject] = await Promise.all([
      Teacher.findOne({
        where: {
          school_id: schoolId,
          id: nextTeacherId,
        },
      }),
      Class.findOne({ where: { id: nextClassId, school_id: schoolId } }),
      Section.findOne({
        where: {
          id: nextSectionId,
          class_id: nextClassId,
          school_id: schoolId,
          is_active: true,
        },
      }),
      Subject.findOne({ where: { id: nextSubjectId, school_id: schoolId } }),
    ]);

    if (!teacher) {
      throw new AppError("TEACHER_NOT_FOUND", 404);
    }
    if (!cls) {
      throw new AppError("CLASS_NOT_FOUND", 404);
    }
    if (!section) {
      throw new AppError("SECTION_NOT_FOUND", 404);
    }
    if (!subject) {
      throw new AppError("SUBJECT_NOT_FOUND", 404);
    }

    const duplicateAssignment = await TeacherAssignment.findOne({
      where: {
        school_id: schoolId,
        teacher_id: teacher.id,
        class_id: nextClassId,
        section_id: nextSectionId,
        subject_id: nextSubjectId,
        academic_year: nextAcademicYear,
        is_active: true,
        id: { [Op.ne]: assignmentId },
      },
    });

    if (duplicateAssignment) {
      throw new AppError(
        "Teacher already assigned to this subject in this section",
        409
      );
    }

    updates.teacher_id = teacher.id;
    updates.class_id = nextClassId;
    updates.section_id = nextSectionId;
    updates.subject_id = nextSubjectId;
  }

  // If trying to set as class teacher, check if target section already has a class teacher
  if (updates.is_class_teacher === true) {
    const existingClassTeacher = await TeacherAssignment.findOne({
      where: {
        school_id: schoolId,
        section_id: nextSectionId,
        is_class_teacher: true,
        is_active: true,
        id: { [Op.ne]: assignmentId }, // Exclude current assignment
      },
    });

    if (existingClassTeacher) {
      throw new AppError(
        "This section already has a class teacher assigned",
        409
      );
    }
  }

  await assignment.update(updates);
  return assignment;
}

/* DELETE (soft delete by setting is_active to false) */
export async function deleteAssignment({ schoolId, assignmentId }) {
  const assignment = await TeacherAssignment.findOne({
    where: {
      id: assignmentId,
      school_id: schoolId,
    },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  await assignment.update({ is_active: false });
  return { message: "Assignment deleted successfully" };
}

