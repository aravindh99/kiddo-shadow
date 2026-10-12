import {
  getTeacherAttendanceAnalyticsService,
  getParentAttendanceAnalyticsService,
} from "./attendance.analytics.service.js";

/* =========================
   TEACHER
========================= */
export const getTeacherAttendanceAnalytics = async (req, res, next) => {
  try {
    const result = await getTeacherAttendanceAnalyticsService({
      school_id: req.user.school_id,
      query: req.query,
      teacher_id: req.user.teacher_id,
    });

    res.json({ items: result });
  } catch (e) {
    next(e);
  }
};

/* =========================
   PARENT
========================= */
export const getParentAttendanceAnalytics = async (req, res, next) => {
  try {
    const result = await getParentAttendanceAnalyticsService({
      parent_user_id: req.user.id,
      school_id: req.user.school_id,
      query: req.query,
    });

    res.json({ items: result });
  } catch (e) {
    next(e);
  }
};
