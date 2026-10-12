import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  markAttendanceSchema,
  attendanceSummarySchema,
} from "./attendance.summary.schema.js";

import {
  markAttendance,
  getTeacherAttendanceSummary,
  getParentAttendanceSummary,
  getStudentAttendanceSummary,
} from "./attendance.summary.controller.js";

const router = express.Router();

/* =========================
   TEACHER
========================= */
router.post(
  "/teachers/attendance",
  protect,
  allowRoles("teacher"),
  validate(markAttendanceSchema),
  markAttendance
);

router.get(
  "/teachers/attendance/summary",
  protect,
  allowRoles("teacher"),
  validate(attendanceSummarySchema),
  getTeacherAttendanceSummary
);

/* =========================
   PARENT
========================= */
router.get(
  "/parents/attendance/summary",
  protect,
  allowRoles("parent"),
  validate(attendanceSummarySchema),
  getParentAttendanceSummary
);

/* =========================
   STUDENT
========================= */
router.get(
  "/students/attendance/summary",
  protect,
  allowRoles("student"),
  validate(attendanceSummarySchema),
  getStudentAttendanceSummary
);

export default router;
