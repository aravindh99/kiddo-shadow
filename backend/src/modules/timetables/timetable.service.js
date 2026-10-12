import db from "../../config/db.js";
import { Op } from "sequelize";

import Timetable from "./timetable.model.js";
import Section from "../sections/section.model.js";
import Class from "../classes/classes.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Subject from "../subjects/subject.model.js";
import User from "../users/user.model.js";
import Teacher from "../teachers/teacher.model.js";
import AppError from "../../shared/appError.js";
import Notification from "../notifications/notification.model.js";

/* =====================================================
   CREATE / UPDATE SECTION TIMETABLE
   (School Admin or Class Teacher)
===================================================== */
export const saveTimetableService = async ({
  user,
  school_id,
  class_id,
  section_id,
  day_of_week,
  entries,
}) => {
  return db.transaction(async (t) => {
    /**
     * 1️⃣ Validate section
     */
    const section = await Section.findOne({
      where: { id: section_id, class_id, school_id, is_active: true },
      transaction: t,
    });

    if (!section) {
      throw new AppError("SECTION_NOT_FOUND", 404);
    }

    /**
     * 2️⃣ Permission check
     * - School admin: always allowed
     * - Teacher: must be class teacher of this section
     */
    if (user.role === "teacher") {
      const isClassTeacher = await TeacherAssignment.findOne({
        where: {
          section_id,
          school_id,
          teacher_id: user.teacher_id,
          is_class_teacher: true,
          is_active: true,
        },
        transaction: t,
      });

      if (!isClassTeacher) {
        throw new AppError("FORBIDDEN", 403);
      }
    }

    /**
     * 3️⃣ Fetch existing timetable for diffing before removal
     */
    const existingTimetables = await Timetable.findAll({
      where: { school_id, class_id, section_id, day_of_week },
      transaction: t,
    });

    const isTeacher = user.role === "teacher";
    const newApprovalStatus = isTeacher ? "pending" : "approved";

    // Only delete existing ones if Admin is saving, OR if we are deleting previous pending requests
    if (!isTeacher) {
      await Timetable.destroy({
        where: { school_id, class_id, section_id, day_of_week },
        transaction: t,
      });
    } else {
      // If teacher is saving, only delete their previous PENDING requests for this day to replace with new ones
      await Timetable.destroy({
        where: { school_id, class_id, section_id, day_of_week, approval_status: "pending" },
        transaction: t,
      });
    }

    /**
     * 4️⃣ Insert new timetable entries & Validate Availability
     */
    const validAssignments = [];

    for (const e of entries) {
      if (!e.is_break && !e.teacher_assignment_id) {
        throw new AppError("ASSIGNMENT_REQUIRED", 400);
      }

      let assignment = null;

      if (!e.is_break) {
        assignment = await TeacherAssignment.findOne({
          where: {
            id: e.teacher_assignment_id,
            school_id,
            is_active: true,
          },
          include: [
            { model: Class, attributes: ["class_name"] },
            { model: Subject, attributes: ["name"] },
            { model: Teacher, attributes: ["user_id"] }
          ],
          transaction: t,
        });

        if (!assignment) {
          throw new AppError("INVALID_TEACHER_ASSIGNMENT", 400);
        }

        // Find all assignments for this teacher to check if they are busy
        const teacherAssignments = await TeacherAssignment.findAll({
          where: { school_id, teacher_id: assignment.teacher_id },
          attributes: ['id'],
          transaction: t
        });
        const teacherAssignmentIds = teacherAssignments.map(a => a.id);

        const busy = await Timetable.findOne({
          where: {
            school_id,
            day_of_week,
            start_time: { [Op.lt]: e.end_time },
            end_time: { [Op.gt]: e.start_time },
            teacher_assignment_id: { [Op.in]: teacherAssignmentIds },
            approval_status: "approved", // Only check against approved timetables
            // Exclude the current class and section we are modifying
            [Op.not]: {
              [Op.and]: [
                { class_id },
                { section_id }
              ]
            }
          },
          transaction: t
        });

        if (busy) {
          throw new AppError("The selected teacher is no longer available for this period. Please choose another available teacher.", 400);
        }
        
        // Detect if this is a new or switched assignment
        // We only care about comparing against existing APPROVED timetables to trigger notifications
        const existingApprovedEntry = existingTimetables.find(
          (et) => 
            et.start_time === e.start_time && 
            et.end_time === e.end_time &&
            et.approval_status === "approved"
        );

        const isSwitched = !existingApprovedEntry || String(existingApprovedEntry.teacher_assignment_id) !== String(assignment.id);

        if (isSwitched) {
          validAssignments.push({ entry: e, assignment });
        }
      }

      await Timetable.create(
        {
          school_id,
          class_id,
          section_id,
          day_of_week,
          start_time: e.start_time,
          end_time: e.end_time,
          teacher_assignment_id: e.is_break ? null : assignment.id,
          is_break: e.is_break,
          title: e.is_break ? e.title : null,
          approval_status: newApprovalStatus,
        },
        { transaction: t }
      );
    }

    /**
     * 5️⃣ Send Notifications
     */
    if (isTeacher) {
      // Teacher is requesting a change -> notify admin for approval
      for (const { entry, assignment } of validAssignments) {
        const className = assignment.class?.class_name || "Unknown";
        const subjectName = assignment.subject?.name || "Unknown";
        const period = entry.title || "Period";

        await Notification.create({
          school_id,
          sender_user_id: user.id,
          sender_role: user.role,
          title: "Teacher Assignment Request",
          message: `A teacher assignment request has been created for Class ${className}, Subject ${subjectName}, Period ${period}. Awaiting approval workflow.`,
          target_role: "school_admin",
          class_id,
          section_id,
        }, { transaction: t });
      }
    } else {
      // Admin is directly modifying the timetable -> notify the new teacher
      for (const { entry, assignment } of validAssignments) {
        const className = assignment.class?.class_name || "Unknown";
        const subjectName = assignment.subject?.name || "Unknown";
        const period = entry.title || "Period";
        const teacherUserId = assignment.teacher?.user_id;

        if (teacherUserId) {
          await Notification.create({
            school_id,
            sender_user_id: user.id,
            sender_role: user.role,
            title: "Class Assignment Update",
            message: `You have been assigned to Class ${className}, Subject ${subjectName}, ${period} (${entry.start_time} - ${entry.end_time}).`,
            target_role: "teacher",
            target_user_id: teacherUserId,
            class_id: null,
            section_id: null,
          }, { transaction: t });
        }
      }
    }

    return { success: true };
  });
};

export const approveTimetableService = async ({
  user,
  school_id,
  class_id,
  section_id,
  action,
}) => {
  return db.transaction(async (t) => {
    if (action === "approve") {
      // Find days that have pending entries
      const pendingDays = await Timetable.findAll({
        attributes: ['day_of_week'],
        where: { school_id, class_id, section_id, approval_status: "pending" },
        group: ['day_of_week'],
        transaction: t
      });
      const days = pendingDays.map(p => p.day_of_week);

      if (days.length > 0) {
        // Fetch full pending entries before updating, to trigger notifications
        const pendingTimetables = await Timetable.findAll({
          where: { school_id, class_id, section_id, day_of_week: { [Op.in]: days }, approval_status: "pending" },
          include: [
            {
              model: TeacherAssignment,
              include: [
                { model: Class, attributes: ["class_name"] },
                { model: Subject, attributes: ["name"] },
                { model: Teacher, attributes: ["user_id"] }
              ],
              required: false
            }
          ],
          transaction: t
        });

        await Timetable.destroy({
          where: { school_id, class_id, section_id, day_of_week: { [Op.in]: days }, approval_status: "approved" },
          transaction: t,
        });

        // Mark pending entries as approved
        await Timetable.update(
          { approval_status: "approved" },
          {
            where: { school_id, class_id, section_id, approval_status: "pending" },
            transaction: t,
          }
        );

        // Send Notifications to the newly approved assigned teachers
        for (const pt of pendingTimetables) {
          if (pt.is_break || !pt.teacher_assignment) continue;
          
          const className = pt.teacher_assignment.class?.class_name || "Unknown";
          const subjectName = pt.teacher_assignment.subject?.name || "Unknown";
          const period = pt.title || "Period";
          const teacherUserId = pt.teacher_assignment.teacher?.user_id;

          if (teacherUserId) {
            await Notification.create({
              school_id,
              sender_user_id: user.id,
              sender_role: user.role,
              title: "Timetable Request Approved",
              message: `Your class assignment for Class ${className}, Subject ${subjectName}, ${period} (${pt.start_time} - ${pt.end_time}) has been approved.`,
              target_role: "teacher",
              target_user_id: teacherUserId,
              class_id: null,
              section_id: null,
            }, { transaction: t });
          }
        }
      }
    } else if (action === "reject") {
      // Just delete the pending entries
      await Timetable.destroy({
        where: { school_id, class_id, section_id, approval_status: "pending" },
        transaction: t,
      });
    }

    return { success: true };
  });
};

/* =====================================================
   STUDENT VIEW: SECTION TIMETABLE
   (Mon–Sat, periods with subject & time)
===================================================== */
export const getSectionTimetableService = async ({
  school_id,
  class_id,
  section_id,
}) => {
  const rows = await Timetable.findAll({
    where: { school_id, class_id, section_id, approval_status: "approved" },
    include: [
      {
        model: TeacherAssignment,
        required: false,
        include: [
          {
            model: Subject,
            attributes: ["id", "name"],
          },
          {
            model: Teacher,
            attributes: ["id"],
            include: [{ model: User, attributes: ["name"] }],
          },
        ],
        attributes: ["id", "teacher_id", "subject_id"],
      },
    ],
    order: [
      ["day_of_week", "ASC"],
      ["start_time", "ASC"],
    ],
  });

  /**
   * Group by day_of_week (Monday → Saturday)
   */
  const grouped = {};

  for (const row of rows) {
    const day = row.day_of_week;
    if (!grouped[day]) grouped[day] = [];

    grouped[day].push({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      is_break: row.is_break,
      title: row.is_break ? row.title : null,
      teacher_assignment_id: row.teacher_assignment?.id ?? null,
      teacher_id: row.teacher_assignment?.teacher_id ?? null,
      subject_id: row.teacher_assignment?.subject_id ?? null,
      subject: row.is_break ? null : row.teacher_assignment?.subject,
      teacher: row.teacher_assignment?.teacher?.user
        ? { id: row.teacher_assignment.teacher.id, name: row.teacher_assignment.teacher.user.name }
        : null,
    });
  }

  return grouped;
};

/* =====================================================
   TEACHER VIEW: OWN TIMETABLE
   (Which class, section, subject, time)
===================================================== */
export const getTeacherTimetableService = async ({
  school_id,
  teacher_id,
}) => {
  const teacherIds = Array.isArray(teacher_id) ? teacher_id : [teacher_id];

  // 1. Get classes and sections where this teacher has active assignments
  const assignments = await TeacherAssignment.findAll({
    where: {
      school_id,
      teacher_id: { [Op.in]: teacherIds.filter(Boolean) },
      is_active: true,
    },
    attributes: ["class_id", "section_id"],
  });

  const classIds = [...new Set(assignments.map((a) => a.class_id))];
  const sectionIds = [...new Set(assignments.map((a) => a.section_id))];

  if (!classIds.length || !sectionIds.length) {
    return {};
  }

  // 2. Fetch all timetable entries for these classes/sections
  const rows = await Timetable.findAll({
    where: {
      school_id,
      class_id: { [Op.in]: classIds },
      section_id: { [Op.in]: sectionIds },
    },
    include: [
      {
        model: TeacherAssignment,
        required: false,
        include: [
          {
            model: Subject,
            attributes: ["id", "name"],
          },
          {
            model: Teacher,
            attributes: ["id"],
            include: [{ model: User, attributes: ["name"] }],
          },
        ],
        attributes: ["id", "teacher_id", "subject_id"],
      },
      {
        model: Class,
        attributes: ["id", "class_name"],
      },
      {
        model: Section,
        attributes: ["id", "name"],
      },
    ],
    order: [
      ["day_of_week", "ASC"],
      ["start_time", "ASC"],
    ],
  });

  // Get current local time in Asia/Kolkata for status calculation
  const timezone = "Asia/Kolkata";
  const d = new Date();
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const currentTimeStr = timeFormatter.format(d);

  // Group by day_of_week AND class_id AND section_id to assign sequential period numbers
  const sectionDayGroups = {};
  for (const row of rows) {
    const key = `${row.day_of_week}-${row.class_id}-${row.section_id}`;
    if (!sectionDayGroups[key]) {
      sectionDayGroups[key] = [];
    }
    sectionDayGroups[key].push(row);
  }

  // Assign period number sequentially
  const periodNumberMap = new Map(); // maps row.id to "P1", "P2", etc.
  for (const key in sectionDayGroups) {
    // Sort by start_time (already sorted by query, but let's be safe)
    sectionDayGroups[key].sort((a, b) => a.start_time.localeCompare(b.start_time));
    sectionDayGroups[key].forEach((row, index) => {
      periodNumberMap.set(row.id, `P${index + 1}`);
    });
  }

  // Filter to keep only this teacher's periods
  const filteredRows = rows.filter((row) => {
    if (!row.teacher_assignment_id) {
      return false; // Skip unassigned periods
    }
    const teacherIdInAssignment = row.teacher_assignment?.teacher_id;
    return teacherIds.map(String).includes(String(teacherIdInAssignment));
  });

  const grouped = {};
  for (const row of filteredRows) {
    const day = row.day_of_week;
    if (!grouped[day]) grouped[day] = [];

    // Calculate status: Upcoming, Ongoing, Completed
    let status = "Upcoming";
    
    // Ensure sessions remain "Ongoing" until at least 16:30 for flexible attendance
    const closingTime = row.end_time > "16:30:00" ? row.end_time : "16:30:00";
    
    if (currentTimeStr >= row.start_time && currentTimeStr <= closingTime) {
      status = "Ongoing";
    } else if (currentTimeStr > closingTime) {
      status = "Completed";
    }

    grouped[day].push({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      is_break: row.is_break,
      title: row.is_break ? row.title : null,
      class_id: row.class_id,
      section_id: row.section_id,
      class: row.class,
      section: row.section,
      period_number: periodNumberMap.get(row.id) || "P",
      status,
      teacher_assignment_id: row.teacher_assignment?.id ?? null,
      teacher_id: row.teacher_assignment?.teacher_id ?? null,
      subject_id: row.teacher_assignment?.subject_id ?? null,
      subject: row.is_break ? null : row.teacher_assignment?.subject,
      teacher: row.teacher_assignment?.teacher?.user
        ? { id: row.teacher_assignment.teacher.id, name: row.teacher_assignment.teacher.user.name }
        : null,
    });
  }

  return grouped;
};

export const getPendingTimetablesService = async ({ school_id }) => {
  const pending = await Timetable.findAll({
    where: { school_id, approval_status: "pending" },
    include: [
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
      { 
        model: TeacherAssignment, 
        include: [
          { model: Teacher, include: [{ model: User, attributes: ["name", "username", "avatar_url"] }] },
          { model: Subject, attributes: ["name"] }
        ]
      }
    ],
    order: [["created_at", "DESC"]]
  });

  // Group by day, class and section
  const formatted = pending.map(p => ({
    id: p.id,
    type: "timetable",
    created_at: p.created_at,
    user: {
      name: p.teacher_assignment?.teacher?.user?.name || "Teacher",
      username: p.teacher_assignment?.teacher?.user?.username || "N/A",
      avatar_url: p.teacher_assignment?.teacher?.user?.avatar_url || null,
    },
    class: p.class,
    section: p.section,
    start_time: p.start_time,
    end_time: p.end_time,
    day_of_week: p.day_of_week,
    subject: p.teacher_assignment?.subject?.name || "Subject"
  }));

  return {
    count: formatted.length,
    rows: formatted
  };
};
