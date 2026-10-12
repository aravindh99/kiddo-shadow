import Teacher from "./teacher.model.js";
import User from "../users/user.model.js";
import AppError from "../../shared/appError.js";

import { triggerProfileUpdateNotification, triggerProfileApprovalNotification } from "../notifications/notification-trigger.service.js";

/* =========================
   TEACHER: REQUEST UPDATE
========================= */
export const requestTeacherProfileUpdateService = async (
  user_id,
  updates
) => {
  const teacher = await Teacher.findOne({ where: { user_id } });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  if (teacher.approval_status === "pending") {
    throw new AppError("Profile update already pending approval", 409);
  }

  const { avatar_url, ...teacherUpdates } = updates || {};
  const userUpdates = {};
  const change_details = [];

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

  const userFields = ['name', 'phone', 'email'];
  userFields.forEach(field => {
    if (updates[field] !== undefined) {
      const currentVal = (currentUser?.[field] ?? '').toString().trim();
      const newVal = (updates[field] ?? '').toString().trim();
      if (newVal !== currentVal) {
        userUpdates[field] = updates[field];
        change_details.push(`${field} changed from '${currentVal}' to '${newVal}'`);
      }
      delete teacherUpdates[field];
    }
  });

  const teacherData = teacher.get({ plain: true });
  const teacherFields = ['gender', 'designation', 'qualification', 'experience'];

  teacherFields.forEach(field => {
    if (teacherUpdates[field] !== undefined) {
      const currentVal = (teacherData[field] ?? '').toString().trim();
      const newVal = (teacherUpdates[field] ?? '').toString().trim();
      if (newVal === currentVal) {
        delete teacherUpdates[field];
      } else {
        change_details.push(`${field} changed from '${currentVal}' to '${newVal}'`);
      }
    }
  });

  const allowedTeacherFields = new Set(teacherFields);
  Object.keys(teacherUpdates).forEach(k => {
    if (!allowedTeacherFields.has(k)) {
      delete teacherUpdates[k];
    }
  });

  const totalChanges = Object.keys(userUpdates).length + Object.keys(teacherUpdates).length;
  if (totalChanges === 0) {
    return { message: "No changes detected" };
  }

  await teacher.update({
    approval_status: "pending",
    pending_updates: { user: userUpdates, teacher: teacherUpdates },
  });

  const changedFields = [...Object.keys(userUpdates), ...Object.keys(teacherUpdates)];
  await triggerProfileUpdateNotification({
    school_id: teacher.school_id,
    sender_user_id: user_id,
    sender_role: "teacher",
    student_name: null,
    parent_name: null,
    changed_fields: changedFields,
    change_details,
  }).catch(err => console.error("Failed to trigger profile update notification", err));

  return {
    message: "Profile update submitted for admin approval",
  };
};

/* =========================
   ADMIN: APPROVE / REJECT
========================= */
export const approveTeacherProfileService = async ({
  teacher_id,
  admin_user_id,
  school_id,
  action,
}) => {
  const teacher = await Teacher.findOne({
    where: { id: teacher_id, school_id },
  });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  if (teacher.approval_status !== "pending") {
    throw new AppError("No pending approval for this teacher", 400);
  }

  if (action === "approve") {
    const changeDetails = [];
    if (teacher.pending_updates) {
      const { user: userUpdates, teacher: teacherUpdates } = teacher.pending_updates;
      const currentUser = await User.findByPk(teacher.user_id);

      if (userUpdates && Object.keys(userUpdates).length > 0) {
        for (const [key, newVal] of Object.entries(userUpdates)) {
          changeDetails.push(`${key} changed from '${currentUser[key] ?? ''}' to '${newVal}'`);
        }
        await User.update(userUpdates, { where: { id: teacher.user_id } });
      }

      if (teacherUpdates && Object.keys(teacherUpdates).length > 0) {
        for (const [key, newVal] of Object.entries(teacherUpdates)) {
          changeDetails.push(`${key} changed from '${teacher[key] ?? ''}' to '${newVal}'`);
        }
        await teacher.update(teacherUpdates);
      }
    }

    await teacher.update({
      approval_status: "approved",
      approved_by: admin_user_id,
      approved_at: new Date(),
      pending_updates: null,
    });

    await triggerProfileApprovalNotification({
      school_id,
      sender_user_id: admin_user_id,
      target_user_id: teacher.user_id,
      target_role: "teacher",
      change_details: changeDetails
    }).catch(err => console.error("Failed to trigger approval notification", err));

    // Optional: activate teacher user on approval
    await User.update(
      { is_active: true, first_login: false },
      { where: { id: teacher.user_id } }
    );
  }

  if (action === "reject") {
    await teacher.update({
      approval_status: "rejected",
      approved_by: admin_user_id,
      approved_at: new Date(),
      pending_updates: null,
    });
  }

  return {
    teacher_id,
    status: action,
  };
};
