import asyncHandler from "../../shared/asyncHandler.js";
import { getParentDailyDashboardService } from "./parent.dashboard.service.js";
import { listNotificationsForUserService } from "../notifications/notification.service.js";
import { listParentAssignmentResults } from "../ai-test-assignments/ai-test-assignment.service.js";
import { listApprovedParentLinks } from "./parent.family.service.js";

export const getParentDashboard = asyncHandler(async (req, res) => {
  const selectedStudentId = req.query.student_id ? Number(req.query.student_id) : null;
  const [data, links] = await Promise.all([
    getParentDailyDashboardService({
      school_id: req.user.school_id,
      parent_user_id: req.user.id,
      student_id: selectedStudentId,
    }),
    listApprovedParentLinks({
      parent_user_id: req.user.id,
      school_id: req.user.school_id,
    }),
  ]);

  const classIds = links
    .filter((link) => {
      if (!selectedStudentId) return true;
      const student = link.student ?? link.Student;
      return Number(student?.id) === selectedStudentId;
    })
    .map((l) => (l.student ?? l.Student)?.class_id)
    .filter((v) => v !== undefined && v !== null);
  const sectionIds = links
    .filter((link) => {
      if (!selectedStudentId) return true;
      const student = link.student ?? link.Student;
      return Number(student?.id) === selectedStudentId;
    })
    .map((l) => (l.student ?? l.Student)?.section_id)
    .filter((v) => v !== undefined && v !== null);

  const notificationResult = await listNotificationsForUserService({
    school_id: req.user.school_id,
    user_role: "parent",
    user_id: req.user.id,
    class_ids: classIds,
    section_ids: sectionIds,
  });
  const assignedTests = await listParentAssignmentResults({
    user: req.user,
    student_id: selectedStudentId,
  });

  res.json({
    success: true,
    data,
    assigned_tests: assignedTests.slice(0, 10),
    notifications: {
      total: notificationResult.count,
      items: notificationResult.rows.map((row) => {
        const plain = row.toJSON();
        const ack = plain.notification_acks?.[0];
        return {
          ...plain,
          is_acknowledged: Boolean(ack),
          acknowledged_at: ack?.acknowledged_at || null,
          sender: plain.User
            ? {
                id: plain.User.id,
                name: plain.User.name,
                avatar_url: plain.User.avatar_url,
                role: plain.User.role,
              }
            : null,
          school: plain.School
            ? {
                id: plain.School.id,
                school_name: plain.School.school_name,
                logo_url: plain.School.logo_url,
              }
            : null,
        };
      }),
    },
  });
});
