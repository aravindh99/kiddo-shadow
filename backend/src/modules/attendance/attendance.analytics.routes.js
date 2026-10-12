import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import { attendanceAnalyticsQuerySchema } from "./attendance.analytics.schema.js";
import {
  getTeacherAttendanceAnalytics,
  getParentAttendanceAnalytics,
} from "./attendance.analytics.controller.js";

const router = express.Router();

/* =========================
   TEACHER
========================= */
router.get(
  "/teachers/attendance/analytics",
  protect,
  allowRoles("teacher"),
  validate(attendanceAnalyticsQuerySchema),
  getTeacherAttendanceAnalytics
);

/* =========================
   PARENT
========================= */
router.get(
  "/parents/attendance/analytics",
  protect,
  allowRoles("parent"),
  validate(attendanceAnalyticsQuerySchema),
  getParentAttendanceAnalytics
);

export default router;
