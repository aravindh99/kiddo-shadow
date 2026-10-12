import db from "../../config/db.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import User from "../users/user.model.js";
import Teacher from "../teachers/teacher.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import AppError from "../../shared/appError.js";

const buildTeacherUsername = (schoolId, serial) =>
  `TCH-${schoolId}-${String(serial).padStart(3, "0")}`;

const buildStudentUsername = (schoolId, sectionId, serial) =>
  `STU-${schoolId}-${sectionId}-${String(serial).padStart(3, "0")}`;

const buildParentUsername = (schoolId, studentId) =>
  `PAR-${schoolId}-${studentId}`;

const defaultPassword = (username) => `${username}@123`;

/**
 * BULK CREATE SERVICE
 */
export const bulkCreateDataService = async ({
  school_id,
  classes,
  teacher_count = 10,
}) => {
  return db.transaction(async (t) => {
    // Keep local tx timeouts disabled so larger bulk payloads don't get
    // terminated mid-transaction by Postgres timeout settings.
    await db.query("SET LOCAL statement_timeout = 0", { transaction: t });
    await db.query("SET LOCAL idle_in_transaction_session_timeout = 0", {
      transaction: t,
    });

    /* ================================
       RESPONSE STRUCTURE
    ================================= */
    const response = {
      school_id,
      teachers: [],
      students: [],
      parents: [],
      summary: {
        classes_created: 0,
        teachers_created: 0,
        students_created: 0,
      },
    };
    const createdTeacherIds = [];
    const createdSections = [];

    /* ================================
       1️⃣ CREATE TEACHERS
    ================================= */
    const existingTeacherCount = await Teacher.count({
      where: { school_id },
      transaction: t,
    });

    for (let i = 1; i <= teacher_count; i++) {
      let serial = existingTeacherCount + i;
      let username = buildTeacherUsername(school_id, serial);

      while (true) {
        const exists = await User.findOne({
          where: { school_id, username },
          transaction: t,
        });
        if (!exists) break;
        serial += 1;
        username = buildTeacherUsername(school_id, serial);
      }

      const user = await User.create(
        {
          school_id,
          role: "teacher",
          username,
          password: defaultPassword(username),
          is_active: true,
          first_login: true,
          name: `Teacher ${serial}`,
        },
        { transaction: t }
      );

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

      response.teachers.push({
        teacher_id: teacher.id,
        username,
      });
      createdTeacherIds.push(teacher.id);

      response.summary.teachers_created++;
    }

    /* ================================
       2️⃣ VALIDATE CLASS INPUT
    ================================= */
    if (!Array.isArray(classes) || classes.length === 0) {
      throw new AppError("classes must be a non-empty array", 400);
    }

    const classEntries = classes;
    let nextStudentSerial = await Student.count({
      where: { school_id },
      transaction: t,
    });

    /* ================================
       3️⃣ CREATE CLASSES, SECTIONS,
           STUDENTS & PARENTS
    ================================= */
    for (const classData of classEntries) {
      const [dbClass, classCreated] = await Class.findOrCreate({
        where: {
          school_id,
          class_name: classData.name,
        },
        defaults: {
          school_id,
          class_name: classData.name,
        },
        transaction: t,
      });

      if (classCreated) {
        response.summary.classes_created++;
      }

      for (const sectionData of classData.sections) {
        const [dbSection] = await Section.findOrCreate({
          where: {
            school_id,
            class_id: dbClass.id,
            name: sectionData.name,
          },
          defaults: {
            school_id,
            class_id: dbClass.id,
            name: sectionData.name,
            is_active: true,
          },
          transaction: t,
        });

        if (!dbSection.is_active) {
          await dbSection.update({ is_active: true }, { transaction: t });
        }
        createdSections.push({
          class_id: dbClass.id,
          section_id: dbSection.id,
        });

        for (let i = 1; i <= sectionData.students; i++) {
          nextStudentSerial += 1;
          const serial = nextStudentSerial;
          const stuUsername = buildStudentUsername(
            school_id,
            dbSection.id,
            serial
          );

          const stuUser = await User.create(
            {
              school_id,
              role: "student",
              username: stuUsername,
              password: defaultPassword(stuUsername),
              is_active: true,
              first_login: true,
              name: `Student ${classData.name}${sectionData.name}-${i}`,
            },
            { transaction: t }
          );

          const student = await Student.create(
            {
              user_id: stuUser.id,
              school_id,
              class_id: dbClass.id,
              section_id: dbSection.id,
              admission_no: `ADM-${stuUsername}`,
              approval_status: "pending",
              is_active: true,
            },
            { transaction: t }
          );

          response.students.push({
            student_id: student.id,
            username: stuUsername,
            class: classData.name,
            section: sectionData.name,
          });

          /* ================================
             CREATE PARENT (1:1 DEFAULT)
          ================================= */
          const parUsername = buildParentUsername(school_id, student.id);

          const parUser = await User.create(
            {
              school_id,
              role: "parent",
              username: parUsername,
              password: defaultPassword(parUsername),
              is_active: true,
              first_login: true,
              name: `Parent of ${stuUser.name}`,
            },
            { transaction: t }
          );

          const parent = await Parent.create(
            {
              user_id: parUser.id,
              student_id: student.id,
              relation_type: "guardian",
              approval_status: "pending",
              is_active: true,
            },
            { transaction: t }
          );

          response.parents.push({
            parent_id: parent.id,
            username: parUsername,
            student_id: student.id,
          });

          response.summary.students_created++;
        }
      }
    }

    /* ================================
       4️⃣ ASSIGN CREATED TEACHERS TO SECTIONS
       Ensures section-based teacher list API has data after bulk-create.
    ================================= */
    if (createdTeacherIds.length > 0 && createdSections.length > 0) {
      for (const sec of createdSections) {
        for (const teacherId of createdTeacherIds) {
          const exists = await TeacherAssignment.findOne({
            where: {
              school_id,
              teacher_id: teacherId,
              class_id: sec.class_id,
              section_id: sec.section_id,
              is_active: true,
            },
            transaction: t,
          });

          if (!exists) {
            await TeacherAssignment.create(
              {
                school_id,
                teacher_id: teacherId,
                class_id: sec.class_id,
                section_id: sec.section_id,
                subject_id: null,
                is_active: true,
                is_class_teacher: false,
              },
              { transaction: t }
            );
          }
        }
      }
    }

    return response;
  });
};
