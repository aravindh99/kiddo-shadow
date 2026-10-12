import Notification from "./notification.model.js";
import Parent from "../parents/parent.model.js";

/**
 * Generic trigger helper
 */
const createNotification = async ({
  school_id,
  sender_user_id,
  sender_role,
  title,
  message,
  target_role,
  target_user_id = null,
  class_id = null,
  section_id = null,
}) => {
  return Notification.create({
    school_id,
    sender_user_id,
    sender_role,
    title,
    message,
    target_role,
    target_user_id,
    class_id,
    section_id,
  });
};

/* ===============================
   HOMEWORK CREATED
================================ */
export const triggerHomeworkNotification = async ({
  school_id,
  teacher_user_id,
  class_id,
  section_id,
  subject_name,
}) => {
  return createNotification({
    school_id,
    sender_user_id: teacher_user_id,
    sender_role: "teacher",
    title: "New Homework Assigned",
    message: `New homework has been assigned for ${subject_name}. Please check.`,
    target_role: "all", // parents + students
    class_id,
    section_id,
  });
};

/* ===============================
   EXAM CREATED
================================ */
export const triggerExamNotification = async ({
  school_id,
  sender_user_id,
  sender_role,
  exam_name,
  class_id,
  section_id,
  start_date,
  end_date,
}) => {
  const formattedStart = start_date
    ? new Date(start_date).toLocaleDateString("en-GB")
    : null;
  const formattedEnd = end_date
    ? new Date(end_date).toLocaleDateString("en-GB")
    : null;

  let message = `A new exam "${exam_name}" has been scheduled.`;
  if (formattedStart && formattedEnd) {
    message += ` Dates: ${formattedStart} to ${formattedEnd}.`;
  } else if (formattedStart) {
    message += ` Date: ${formattedStart}.`;
  }

  return createNotification({
    school_id,
    sender_user_id,
    sender_role,
    title: "New Exam Scheduled",
    message,
    target_role: "all", // students + parents
    class_id,
    section_id,
  });
};

/* ===============================
   REPORT CARD PUBLISHED
================================ */
export const triggerReportCardNotification = async ({
  school_id,
  teacher_user_id,
  student_name,
  exam_name,
  class_id,
  section_id,
}) => {
  return createNotification({
    school_id,
    sender_user_id: teacher_user_id,
    sender_role: "teacher",
    title: "Report Card Published",
    message: `Report card for ${student_name} (${exam_name}) has been published.`,
    target_role: "all", // students + parents
    class_id,
    section_id,
  });
};

/* ===============================
   PROFILE UPDATE REQUEST
================================ */
export const triggerProfileUpdateNotification = async ({
  school_id,
  sender_user_id,
  sender_role,
  student_name,
  parent_name,
  changed_fields = [],
  change_details = [],
  class_id,
  section_id,
  target_role = "school_admin", // Default to school admin (for teachers/parents)
}) => {
  let userDesc = "";
  if (sender_role === "student" && student_name) userDesc = `Student ${student_name}`;
  else if (sender_role === "parent" && parent_name) userDesc = `Parent ${parent_name}`;
  else userDesc = `${sender_role} user`;

  const fieldLabels = {
    name: 'Name', phone: 'Phone', email: 'Email',
    dob: 'Date of Birth', gender: 'Gender', blood_group: 'Blood Group',
    father_name: 'Father Name', mother_name: 'Mother Name',
    guardian_name: 'Guardian Name', father_occupation: 'Father Occupation',
    mother_occupation: 'Mother Occupation', address: 'Address',
    family_income: 'Family Income', relation_type: 'Relation Type',
    avatar_url: 'Profile Photo',
  };

  let changesText = "profile update request";
  if (change_details && change_details.length > 0) {
    changesText = `profile update request: ${change_details.join(', ')}`;
  } else if (changed_fields && changed_fields.length > 0) {
    if (changed_fields.length === 1) {
      const f = changed_fields[0];
      changesText = `${fieldLabels[f] || f.replace(/_/g, ' ')} change request`;
    } else {
      const labels = changed_fields.map(f => fieldLabels[f] || f.replace(/_/g, ' '));
      changesText = `${labels.join(', ')} change request`;
    }
  }

  const message = `${userDesc} submitted a ${changesText}.`;

  return createNotification({
    school_id,
    sender_user_id,
    sender_role,
    title: "Profile Update Request",
    message,
    target_role, 
    class_id,
    section_id,
  });
};

export const triggerProfileApprovalNotification = async ({
  school_id,
  sender_user_id,
  target_user_id,
  target_role,
  change_details = [],
}) => {
  let message = `Your profile update request has been approved.`;
  if (change_details && change_details.length > 0) {
    message += ` Changes: ${change_details.join(', ')}`;
  }

  return createNotification({
    school_id,
    sender_user_id,
    sender_role: "school_admin",
    title: "Profile Update Approved",
    message,
    target_role,
    target_user_id,
  });
};

/* ===============================
   NEW PROFILE REGISTRATION
================================ */
export const triggerNewProfileNotification = async ({
  school_id,
  sender_user_id,
  sender_role,
  user_name,
}) => {
  let userDesc = "";
  if (user_name) userDesc = `${sender_role.charAt(0).toUpperCase() + sender_role.slice(1)} ${user_name}`;
  else userDesc = `A new ${sender_role}`;

  return createNotification({
    school_id,
    sender_user_id,
    sender_role,
    title: "New Registration Pending",
    message: `${userDesc} has completed their profile and is waiting for approval.`,
    target_role: "school_admin",
  });
};

/* ===============================
   ATTENDANCE MARKED
================================ */
export const triggerAttendanceNotification = async ({
  school_id,
  teacher_id,
  subject_name,
  class_id,
  section_id,
  attendanceDate,
  records,
  studentUserMap,
}) => {
  const formattedDate = attendanceDate 
    ? new Date(attendanceDate).toLocaleDateString("en-GB") 
    : new Date().toLocaleDateString("en-GB");

  const promises = [];

  for (const record of records) {
    const rawId = Number(record.student_id);
    const targetUserId = studentUserMap.get(rawId);
    if (!targetUserId) continue;

    // Notify Student
    promises.push(
      createNotification({
        school_id,
        sender_user_id: teacher_id,
        sender_role: "teacher",
        title: "Attendance Update",
        message: `You were marked ${record.status} for ${subject_name} on ${formattedDate}.`,
        target_role: "student",
        target_user_id: targetUserId,
        class_id: null,
        section_id: null,
      })
    );

    // Notify Parents
    const parents = await Parent.findAll({
      where: { student_id: rawId, approval_status: "approved" },
    });

    for (const parent of parents) {
      if (parent.user_id) {
        promises.push(
          createNotification({
            school_id,
            sender_user_id: teacher_id,
            sender_role: "teacher",
            title: "Attendance Update",
            message: `Your child was marked ${record.status} for ${subject_name} on ${formattedDate}.`,
            target_role: "parent",
            target_user_id: parent.user_id,
            class_id: null,
            section_id: null,
          })
        );
      }
    }
  }

  await Promise.all(promises);
};
