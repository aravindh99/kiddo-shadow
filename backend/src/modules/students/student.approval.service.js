import db from "../../config/db.js";
import Student from "./student.model.js";
import User from "../users/user.model.js";
import AppError from "../../shared/appError.js";
import { logApprovalAction } from "../../shared/utils/auditLogger.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import { triggerProfileUpdateNotification, triggerProfileApprovalNotification } from "../notifications/notification-trigger.service.js";

/* =========================
   STUDENT: REQUEST UPDATE
========================= */

/* =========================
   STUDENT: REQUEST UPDATE
========================= */
export const requestStudentProfileUpdateService = async (
  user_id,
  updates
) => {
  const student = await Student.findOne({ where: { user_id } });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (student.approval_status === "pending") {
    throw new AppError("Profile update already pending approval", 409);
  }

  const { avatar_url, ...studentUpdates } = updates || {};
  const userUpdates = {};
  const change_details = [];

  // Load the current user record to compare against
  const currentUser = await User.findByPk(user_id, {
    attributes: ['id', 'name', 'phone', 'email', 'avatar_url'],
  });

  if (avatar_url !== undefined) {
    const currentAvatar = currentUser?.avatar_url || null;
    const newAvatar = avatar_url || null;
    if (newAvatar !== currentAvatar) {
      await currentUser.update({ avatar_url: newAvatar });
    }
  }

  // Collect user-level fields — only if the value actually changed
  const userFields = ['name', 'phone', 'email'];
  userFields.forEach(field => {
    if (updates[field] !== undefined) {
      const currentVal = (currentUser?.[field] ?? '').toString().trim();
      const newVal = (updates[field] ?? '').toString().trim();
      if (newVal !== currentVal) {
        userUpdates[field] = updates[field];
        change_details.push(`${field} changed from '${currentVal}' to '${newVal}'`);
      }
      delete studentUpdates[field];
    }
  });

  // Get current student record values for comparison
  const studentData = student.get({ plain: true });
  const studentFields = ['dob', 'gender', 'blood_group', 'father_name', 'mother_name',
    'guardian_name', 'father_occupation', 'mother_occupation', 'address', 'family_income',
    'aadhar_no', 'roll_no', 'admission_no'];

  // Strip out student fields that did NOT actually change
  studentFields.forEach(field => {
    if (studentUpdates[field] !== undefined) {
      const currentVal = (studentData[field] ?? '').toString().trim();
      const newVal = (studentUpdates[field] ?? '').toString().trim();
      if (newVal === currentVal) {
        delete studentUpdates[field];
      } else {
        change_details.push(`${field} changed from '${currentVal}' to '${newVal}'`);
      }
    }
  });

  // Remove any leftover non-student fields from studentUpdates
  const allowedStudentFields = new Set([...studentFields, 'gender', 'dob', 'address', 'blood_group']);
  Object.keys(studentUpdates).forEach(k => {
    if (!allowedStudentFields.has(k)) {
      delete studentUpdates[k];
    }
  });

  // If nothing actually changed, return early
  const totalChanges = Object.keys(userUpdates).length + Object.keys(studentUpdates).length;
  if (totalChanges === 0) {
    return { message: "Profile updated" };
  }

  await student.update({
    approval_status: "pending",
    pending_updates: { user: userUpdates, student: studentUpdates },
  });


  const changedFields = [...Object.keys(userUpdates), ...Object.keys(studentUpdates)];
  
  // Need the user name to display in notification
  const studentUser = await User.findByPk(user_id, { attributes: ['name'] });

  await triggerProfileUpdateNotification({
    school_id: student.school_id,
    sender_user_id: user_id,
    sender_role: "student",
    student_name: studentUser ? studentUser.name : "Student",
    changed_fields: changedFields,
    change_details,
    class_id: student.class_id,
    section_id: student.section_id,
    target_role: "teacher", // Send to teacher instead of school admin
  });

  return {
    message: "Profile update submitted for teacher approval",
  };
};

/* =========================
   TEACHER: APPROVE / REJECT
========================= */
export const approveStudentProfileService = async ({
  student_id,
  teacher_user_id,
  teacher_id,
  school_id,
  action,
  remark, // ✅ NOW DEFINED
}) => {
  return db.transaction(async (t) => {
    const student = await Student.findOne({
      where: { id: student_id, school_id },
      transaction: t,
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const hasAssignment = await TeacherAssignment.findOne({
      where: {
        school_id,
        teacher_id,
        section_id: student.section_id,
        is_active: true,
      },
      transaction: t,
    });

    if (!hasAssignment) {
      throw new AppError("Only assigned teachers can approve this student", 403);
    }

    if (student.approval_status !== "pending") {
      throw new AppError("No pending approval for this student", 400);
    }

    if (action === "approve") {
      const changeDetails = [];
      if (student.pending_updates) {
        const { user: userUpdates, student: studentUpdates } = student.pending_updates;
        const currentUser = await User.findByPk(student.user_id, { transaction: t });

        if (userUpdates && Object.keys(userUpdates).length > 0) {
          for (const [key, newVal] of Object.entries(userUpdates)) {
            changeDetails.push(`${key} changed from '${currentUser[key] ?? ''}' to '${newVal}'`);
          }
          await User.update(userUpdates, { where: { id: student.user_id }, transaction: t });
        }

        if (studentUpdates && Object.keys(studentUpdates).length > 0) {
          for (const [key, newVal] of Object.entries(studentUpdates)) {
            changeDetails.push(`${key} changed from '${student[key] ?? ''}' to '${newVal}'`);
          }
          await student.update(studentUpdates, { transaction: t });
        }
      }

      await student.update(
        {
          approval_status: "approved",
          approved_by: teacher_user_id,
          approved_at: new Date(),
          rejection_reason: null,
          pending_updates: null,
        },
        { transaction: t }
      );

      // Permanently clear first_login upon approval so they aren't forced into "Complete Profile" flow
      await User.update({ first_login: false }, { where: { id: student.user_id }, transaction: t });

      await triggerProfileApprovalNotification({
        school_id,
        sender_user_id: teacher_user_id,
        target_user_id: student.user_id,
        target_role: "student",
        change_details: changeDetails
      }).catch(err => console.error("Failed to trigger approval notification", err));
    }

    if (action === "reject") {
      await student.update(
        {
          approval_status: "rejected",
          approved_by: teacher_user_id,
          approved_at: new Date(),
          rejection_reason: remark,
        },
        { transaction: t }
      );
    }

    // Load student user info for audit snapshot
    const studentUser = await User.findByPk(student.user_id, {
      attributes: ["id", "name", "username"],
      transaction: t,
    });

    // ✅ AUDIT LOG with full snapshot (inside transaction)
    await logApprovalAction({
      entity_type: "student",
      entity_id: String(student.id),
      action,
      remark,
      performed_by: teacher_user_id,
      new_value: {
        pending_updates: student.pending_updates || {},
        user: { id: student.user_id, name: studentUser?.name, username: studentUser?.username },
        class_id: student.class_id,
        section_id: student.section_id,
        school_id: student.school_id,
      },
      transaction: t,
    });

    return {
      student_id,
      status: action,
    };
  });
};
