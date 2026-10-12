import { getPagination } from "../../shared/utils/pagination.js";
import { Op } from "sequelize";
import AppError from "../../shared/appError.js";

import Student from "../students/student.model.js";
import Teacher from "../teachers/teacher.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import AuditLog from "../audit/audit-log.model.js";
import { resolveTeacherId } from "../../shared/utils/resolveTeacherId.js";
import Notification from "../notifications/notification.model.js";
import NotificationAck from "../notifications/notification-ack.model.js";

const resolveSchoolId = (school_id, user) => {
  const resolved = school_id ?? user?.school_id;
  if (!resolved) {
    throw new AppError("school_id is required", 400);
  }
  return resolved;
};

/* =========================
   TEACHER: STUDENT PENDING
========================= */
export const getPendingStudentApprovalsService = async ({
  school_id,
  user,
  class_id,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    school_id: scopedSchoolId,
    approval_status: "pending",
  };

  if (user?.role === "teacher") {
    const resolvedTeacherId = user.teacher_id ?? (await resolveTeacherId(user));
    if (!resolvedTeacherId) {
      return { count: 0, rows: [] };
    }

    const assignments = await TeacherAssignment.findAll({
      where: {
        school_id: scopedSchoolId,
        teacher_id: resolvedTeacherId,
        is_class_teacher: true,
        is_active: true,
      },
      attributes: ["class_id", "section_id"],
    });

    if (!assignments.length) {
      return { count: 0, rows: [] };
    }

    const allowedClassIds = [
      ...new Set(assignments.map((a) => a.class_id)),
    ];
    const allowedSectionIds = [
      ...new Set(assignments.map((a) => a.section_id)),
    ];

    if (class_id && !allowedClassIds.includes(Number(class_id))) {
      return { count: 0, rows: [] };
    }

    where.section_id = { [Op.in]: allowedSectionIds };
  }

  if (class_id) {
    where.class_id = Number(class_id);
  }

  if (from_date || to_date) {
    where.updated_at = {};
    if (from_date) where.updated_at[Op.gte] = new Date(from_date);
    if (to_date) where.updated_at[Op.lte] = new Date(to_date);
  }

  return Student.findAndCountAll({
    where,
    limit,
    offset,
    order: [["updated_at", "DESC"]],
    include: [
      {
        model: User,
        attributes: ["id", "name", "username", "email", "phone"],
      },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
  });
};

/* =========================
   TEACHER: PARENT PENDING (CLASS TEACHER ONLY)
========================= */
export const getPendingParentApprovalsForTeacherService = async ({
  school_id,
  user,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const resolvedTeacherId = user?.teacher_id ?? (await resolveTeacherId(user));
  if (!resolvedTeacherId) {
    return { count: 0, rows: [] };
  }

  const classTeacherAssignments = await TeacherAssignment.findAll({
    where: {
      school_id: scopedSchoolId,
      teacher_id: resolvedTeacherId,
      is_class_teacher: true,
      is_active: true,
    },
    attributes: ["section_id"],
  });

  if (!classTeacherAssignments.length) {
    return { count: 0, rows: [] };
  }

  const allowedSectionIds = [
    ...new Set(classTeacherAssignments.map((a) => a.section_id).filter(Boolean)),
  ];
  if (!allowedSectionIds.length) {
    return { count: 0, rows: [] };
  }

  const where = {
    approval_status: "pending",
  };

  if (from_date || to_date) {
    where.created_at = {};
    if (from_date) where.created_at[Op.gte] = new Date(from_date);
    if (to_date) where.created_at[Op.lte] = new Date(to_date);
  }

  return Parent.findAndCountAll({
    where,
    include: [
      {
        model: User,
        required: true,
        where: { school_id: scopedSchoolId },
        attributes: ["id", "name", "username", "email", "phone"],
      },
      {
        model: Student,
        required: true,
        where: { school_id: scopedSchoolId, section_id: { [Op.in]: allowedSectionIds } },
        include: [
          { model: User, attributes: ["id", "name", "username"] },
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    limit,
    offset,
    distinct: true,
    order: [["updated_at", "DESC"]],
  });
};

/* =========================
   TEACHER: APPROVAL HISTORY
========================= */
export const getTeacherApprovalHistoryService = async ({
  school_id,
  user,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);

  if (!user || !user.id) {
    return { count: 0, rows: [] };
  }

  const statusCondition = { [Op.in]: ["approved", "rejected"] };

  // ── Get teacher's section IDs ─────────────────────────────────────
  let sectionIds = [];
  try {
    const teacherRecord = await Teacher.findOne({ where: { user_id: user.id }, attributes: ["id"] });
    if (teacherRecord) {
      const assignments = await TeacherAssignment.findAll({
        where: { school_id: scopedSchoolId, teacher_id: teacherRecord.id, is_active: true },
        attributes: ["section_id"],
      });
      sectionIds = assignments.map((a) => a.section_id);
    }
  } catch (e) {
    // If lookup fails, show all school data
  }

  // ── STUDENT HISTORY (from student table - backward compatible) ────
  const studentWhere = { school_id: scopedSchoolId, approval_status: statusCondition };
  if (sectionIds.length > 0) {
    studentWhere.section_id = { [Op.in]: sectionIds };
  }

  const studentHistory = await Student.findAll({
    where: studentWhere,
    include: [
      { model: User, attributes: ["id", "name", "username", "email", "phone"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    order: [["updated_at", "DESC"]],
    limit: 50,
  });

  // ── PARENT HISTORY (from parent table - backward compatible) ──────
  const parentHistory = await Parent.findAll({
    where: { approval_status: statusCondition },
    include: [
      {
        model: User,
        required: true,
        where: { school_id: scopedSchoolId },
        attributes: ["id", "name", "username", "email", "phone"],
      },
      {
        model: Student,
        ...(sectionIds.length > 0 ? { where: { section_id: { [Op.in]: sectionIds } }, required: true } : {}),
        include: [
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    order: [["updated_at", "DESC"]],
    limit: 50,
  });

  // ── ALSO get per-event entries from audit_logs (new approvals) ────
  const studentAuditLogs = await AuditLog.findAll({
    where: {
      entity_type: "student",
      action: { [Op.in]: ["approve", "reject"] },
    },
    order: [["created_at", "DESC"]],
    limit: 200,
  });

  // ── Approver names ─────────────────────────────────────────────────
  const approverIds = [...new Set([
    ...studentHistory.map((s) => s.approved_by),
    ...parentHistory.map((p) => p.approved_by),
  ].filter(Boolean))];
  const approverMap = {};
  if (approverIds.length > 0) {
    const approvers = await User.findAll({
      where: { id: { [Op.in]: approverIds } },
      attributes: ["id", "name"],
    });
    approvers.forEach((a) => { approverMap[a.id] = a.name; });
  }

  // ── Build student map for audit log lookup ─────────────────────────
  const studentIds = [...new Set(studentAuditLogs.map((l) => l.entity_id).filter(Boolean))];
  const studentMapForAudit = {};
  if (studentIds.length > 0) {
    const students = await Student.findAll({
      where: { id: { [Op.in]: studentIds.map(Number).filter(Boolean) }, school_id: scopedSchoolId },
      include: [
        { model: User, attributes: ["id", "name", "username"] },
        { model: Class, attributes: ["id", "class_name"] },
        { model: Section, attributes: ["id", "name"] },
      ],
    });
    students.forEach((s) => { studentMapForAudit[String(s.id)] = s; });
  }

  // Filter audit logs to teacher's sections
  const filteredAuditLogs = studentAuditLogs.filter((log) => {
    const student = studentMapForAudit[String(log.entity_id)];
    if (!student) return false;
    if (sectionIds.length > 0) return sectionIds.includes(student.section_id);
    return true;
  });

  // Fetch audit log approver names
  const auditPerformedBy = [...new Set(filteredAuditLogs.map((l) => l.performed_by).filter(Boolean))];
  if (auditPerformedBy.length > 0) {
    const auditApprovers = await User.findAll({
      where: { id: { [Op.in]: auditPerformedBy } },
      attributes: ["id", "name"],
    });
    auditApprovers.forEach((a) => { approverMap[a.id] = a.name; });
  }

  // ── Map student table rows ─────────────────────────────────────────
  // Track which student IDs are covered by audit logs (to avoid duplicates)
  const auditCoveredStudentIds = new Set(filteredAuditLogs.map((l) => String(l.entity_id)));

  const mappedStudentsFromTable = studentHistory
    .filter((s) => !auditCoveredStudentIds.has(String(s.id))) // skip if audit log has it
    .map((s) => ({
      id: `tbl-s-${s.id}`,
      history_type: "student",
      approval_status: s.approval_status,
      rejection_reason: s.rejection_reason || null,
      updated_at: s.updated_at,
      pending_updates: s.pending_updates || {},
      user: s.user?.toJSON?.() || {},
      class: s.class?.toJSON?.() || { class_name: "-" },
      section: s.section?.toJSON?.() || { name: "-" },
      approver: approverMap[s.approved_by] ? { name: approverMap[s.approved_by] } : null,
    }));

  const mappedStudentsFromAudit = filteredAuditLogs.map((log) => {
    const student = studentMapForAudit[String(log.entity_id)];
    const snap = log.new_value || {};
    return {
      id: `audit-s-${log.id}`,
      history_type: "student",
      approval_status: log.action === "approve" ? "approved" : "rejected",
      rejection_reason: log.remark || null,
      updated_at: log.created_at,
      pending_updates: snap.pending_updates || {},
      user: student?.user?.toJSON?.() || snap.user || {},
      class: student?.class?.toJSON?.() || { class_name: "-" },
      section: student?.section?.toJSON?.() || { name: "-" },
      approver: approverMap[log.performed_by] ? { name: approverMap[log.performed_by] } : null,
    };
  });

  // ── Map parent table rows ──────────────────────────────────────────
  const mappedParents = parentHistory.map((p) => ({
    id: `tbl-p-${p.id}`,
    history_type: "parent",
    approval_status: p.approval_status,
    rejection_reason: p.rejection_reason || null,
    updated_at: p.updated_at,
    pending_updates: p.pending_updates || {},
    user: p.user?.toJSON?.() || {},
    student: {
      class: p.student?.class?.toJSON?.() || { class_name: "-" },
      section: p.student?.section?.toJSON?.() || { name: "-" },
    },
    approver: approverMap[p.approved_by] ? { name: approverMap[p.approved_by] } : null,
  }));

  const combined = [
    ...mappedStudentsFromAudit,   // per-event (new)
    ...mappedStudentsFromTable,   // one per student (old, backward compat)
    ...mappedParents,
  ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  const requestedLimit = Number(query?.limit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 10;

  return {
    count: combined.length,
    rows: combined.slice(0, limit),
  };
};




/* =========================
   ADMIN: TEACHER PENDING
========================= */
export const getPendingTeacherApprovalsService = async ({
  school_id,
  user,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    school_id: scopedSchoolId,
    approval_status: "pending",
  };

  if (from_date || to_date) {
    where.updated_at = {};
    if (from_date) where.updated_at[Op.gte] = new Date(from_date);
    if (to_date) where.updated_at[Op.lte] = new Date(to_date);
  }

  return Teacher.findAndCountAll({
    where,
    limit,
    offset,
    order: [["updated_at", "DESC"]],
  });
};

/* =========================
   ADMIN: PARENT PENDING
========================= */
export const getPendingParentApprovalsService = async ({
  school_id,
  user,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    approval_status: "pending",
  };

  if (from_date || to_date) {
    where.created_at = {};
    if (from_date) where.created_at[Op.gte] = new Date(from_date);
    if (to_date) where.created_at[Op.lte] = new Date(to_date);
  }

  return Parent.findAndCountAll({
    where,
    include: [
      {
        model: User,
        required: true,
        where: { school_id: scopedSchoolId }, // FIXED: school scoped
        attributes: ["id", "name", "username", "email", "phone"],
      },
      {
        model: Student,
        include: [
          { model: User, attributes: ["id", "name", "username"] },
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    limit,
    offset,
    distinct: true,
    order: [["updated_at", "DESC"]],
  });
};

/* =========================
   ACTION: APPROVE / REJECT
========================= */
export const processApprovalAction = async ({
  user,
  type,
  id,
  action,
  rejection_reason,
}) => {
  const normalizedType = (() => {
    if (!type) return "";
    if (type === "student_profile") return "student";
    if (type === "parent_profile") return "parent";
    if (type === "teacher_profile") return "teacher";
    return type;
  })();

  // 1. Validate Action
  if (!["approve", "reject"].includes(action)) {
    throw new AppError("Invalid action", 400);
  }
  const status = action === "approve" ? "approved" : "rejected";

  // 2. Determine Target Model
  let Model;
  if (normalizedType === "student") Model = Student;
  else if (normalizedType === "teacher") Model = Teacher;
  else if (normalizedType === "parent") Model = Parent;
  else throw new AppError("Invalid approval type", 400);

  // 3. Find Entity
  const include =
    normalizedType === "parent"
      ? [
          { model: User, attributes: ["school_id"] },
          { model: Student, attributes: ["id", "section_id", "school_id"] },
        ]
      : undefined;

  const normalizedId = Number(id);
  let entity;

  if (normalizedType === "student" || normalizedType === "teacher") {
    // First try matching exactly by the profile table's primary key
    entity = await Model.findOne({
      where: {
        school_id: user.school_id,
        id: normalizedId,
      },
      ...(include ? { include } : {}),
    });
    // If not found, try matching by user_id
    if (!entity) {
      entity = await Model.findOne({
        where: {
          school_id: user.school_id,
          user_id: normalizedId,
        },
        ...(include ? { include } : {}),
      });
    }
  } else {
    entity = await Model.findByPk(id, include ? { include } : undefined);
  }

  if (!entity) throw new AppError("Entity not found", 404);

  const entitySchoolId =
    normalizedType === "parent" ? (entity.user ?? entity.User)?.school_id : entity.school_id;

  // 4. Permission Check (CRITICAL)
  if (user.role === "teacher") {
    if (String(entitySchoolId) !== String(user.school_id)) {
      throw new AppError("Unauthorized", 403);
    }

    const resolvedTeacherId = user.teacher_id ?? (await resolveTeacherId(user));
    if (!resolvedTeacherId) {
      throw new AppError("Teacher profile not found", 403);
    }

    if (normalizedType === "student") {
      const sectionId = entity.section_id ?? null;
      const classId = entity.class_id ?? null;

      if (!sectionId && !classId) {
        throw new AppError("Student class/section missing", 403);
      }

      const assignmentWhere = {
        school_id: user.school_id,
        teacher_id: resolvedTeacherId,
        is_class_teacher: true,
        is_active: true,
      };

      // Class teacher is defined at section level; fallback to class only if needed.
      if (sectionId) assignmentWhere.section_id = sectionId;
      else if (classId) assignmentWhere.class_id = classId;

      const hasClassTeacherAssignment = await TeacherAssignment.findOne({
        where: assignmentWhere,
      });

      if (!hasClassTeacherAssignment) {
        throw new AppError("Only class teacher can approve this student", 403);
      }
    }

    if (normalizedType === "parent") {
      const linkedStudent = entity.student ?? entity.Student;
      if (!linkedStudent) {
        throw new AppError("Parent linked student not found", 404);
      }

      const hasClassTeacherAssignment = await TeacherAssignment.findOne({
        where: {
          school_id: user.school_id,
          teacher_id: resolvedTeacherId,
          section_id: linkedStudent.section_id,
          is_class_teacher: true,
          is_active: true,
        },
      });

      if (!hasClassTeacherAssignment) {
        throw new AppError("Only class teacher can approve this parent", 403);
      }
    }
  }

  if (user.role === "school_admin") {
    if (String(entitySchoolId) !== String(user.school_id)) {
      throw new AppError("Unauthorized", 403);
    }
  }

  // 5. Update Status and Apply Pending Updates
  let finalPendingUpdates = entity.pending_updates;

  if (action === "approve" && entity.pending_updates) {
    const { user: userUpdates, student: studentUpdates, parent: parentUpdates, teacher: teacherUpdates } = entity.pending_updates;

    // Snapshot old values before applying
    const oldValues = {};
    if (userUpdates) {
      const u = await User.findByPk(entity.user_id);
      if (u) {
        for (const k of Object.keys(userUpdates)) oldValues[`user_${k}`] = u[k];
      }
    }
    const entityUpdates = studentUpdates || parentUpdates || teacherUpdates;
    if (entityUpdates) {
      for (const k of Object.keys(entityUpdates)) oldValues[k] = entity[k];
    }
    
    finalPendingUpdates = {
      ...entity.pending_updates,
      _history_old_values: oldValues
    };

    if (userUpdates && Object.keys(userUpdates).length > 0) {
      await User.update(userUpdates, { where: { id: entity.user_id } });
    }

    if (entityUpdates && Object.keys(entityUpdates).length > 0) {
      await entity.update(entityUpdates);
    }
  }

  // Common status update, preserving pending_updates for history
  await entity.update({
    approval_status: status,
    approved_by: user.id,
    approved_at: new Date(),
    rejection_reason: action === "reject" ? (rejection_reason || null) : null,
    pending_updates: finalPendingUpdates
  });

  if (action === "approve" && entity.user_id) {
    await User.update({ is_active: true }, { where: { id: entity.user_id } });
  }

  // Acknowledge the notification automatically for this user
  try {
    const notifications = await Notification.findAll({
      where: {
        school_id: user.school_id,
        title: "Profile Update Request",
        sender_user_id: entity.user_id,
      },
      attributes: ["id"]
    });

    for (const notif of notifications) {
      await NotificationAck.findOrCreate({
        where: { notification_id: notif.id, user_id: user.id },
        defaults: { notification_id: notif.id, user_id: user.id }
      });
    }
  } catch (err) {
    console.error("Failed to acknowledge notifications during approval", err);
  }

  return entity;
};
