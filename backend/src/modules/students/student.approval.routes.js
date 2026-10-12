import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  requestStudentProfileUpdateSchema,
  approveStudentProfileSchema,
} from "./student.approval.schema.js";

import {
  requestStudentProfileUpdate,
  approveStudentProfile,
} from "./student.approval.controller.js";

const router = express.Router();

/* STUDENT */
router.patch(
  "/students/profile/request",
  protect,
  allowRoles("student"),
  validate(requestStudentProfileUpdateSchema),
  requestStudentProfileUpdate
);

/* TEACHER */
router.post(
  "/teachers/students/:student_id/approve",
  protect,
  allowRoles("teacher"),
  validate(approveStudentProfileSchema),
  approveStudentProfile
);

export default router;
