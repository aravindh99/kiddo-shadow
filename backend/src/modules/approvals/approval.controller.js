import {
  getPendingStudentApprovalsService,
  getPendingParentApprovalsForTeacherService,
  getPendingTeacherApprovalsService,
  getPendingParentApprovalsService,
  getTeacherApprovalHistoryService,
} from "./approval.service.js";
import { getPendingTimetablesService } from "../timetables/timetable.service.js";

/* =========================
   TEACHER DASHBOARD
========================= */
export const getTeacherPendingApprovals = async (req, res, next) => {
  try {
    const [students, parents] = await Promise.all([
      getPendingStudentApprovalsService({
        user: req.user,
        class_id: req.query.class_id,
        query: req.query,
      }),
      getPendingParentApprovalsForTeacherService({
        user: req.user,
        query: req.query,
      }),
    ]);

    res.json({
      // Backward-compatible shape (existing consumers expecting students only)
      total: students.count,
      items: students.rows,
      // New categorized payload
      students: {
        total: students.count,
        items: students.rows,
      },
      parents: {
        total: parents.count,
        items: parents.rows,
      },
    });
  } catch (e) {
    next(e);
  }
};

export const getTeacherApprovalHistory = async (req, res, next) => {
  try {
    const history = await getTeacherApprovalHistoryService({
      user: req.user,
      query: req.query,
    });

    res.json({
      total: history.count,
      items: history.rows,
    });
  } catch (e) {
    next(e);
  }
};

/* =========================
   ADMIN DASHBOARD
========================= */
export const getAdminPendingApprovals = async (req, res, next) => {
  try {
    const [teachers, parents, timetables] = await Promise.all([
      getPendingTeacherApprovalsService({
        user: req.user,
        query: req.query,
      }),
      getPendingParentApprovalsService({
        user: req.user, // FIXED: school scoped
        query: req.query,
      }),
      getPendingTimetablesService({
        school_id: req.user.school_id,
      }),
    ]);
    const students = await getPendingStudentApprovalsService({
      user: req.user,
      query: req.query,
    });

    res.json({
      students: {
        total: students.count,
        items: students.rows,
      },
      teachers: {
        total: teachers.count,
        items: teachers.rows,
      },
      parents: {
        total: parents.count,
        items: parents.rows,
      },
      timetables: {
        total: timetables.count,
        items: timetables.rows,
      },
    });
  } catch (e) {
    next(e);
  }
};

/* =========================
   ACTION
========================= */
export const approveRejectRequest = async (req, res, next) => {
  try {
    const { type, id, action } = req.params;
    const rejection_reason = req.body?.rejection_reason;

    const result = await import("./approval.service.js").then(m => m.processApprovalAction({
      user: req.user,
      type,
      id,
      action,
      rejection_reason
    }));

    res.json({ message: "Request processed successfully", result });
  } catch (e) {
    next(e);
  }
};
