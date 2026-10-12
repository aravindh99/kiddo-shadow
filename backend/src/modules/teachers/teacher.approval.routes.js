import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  requestTeacherProfileUpdateSchema,
  approveTeacherProfileSchema,
} from "./teacher.approval.schema.js";

import {
  requestTeacherProfileUpdate,
  approveTeacherProfile,
} from "./teacher.approval.controller.js";

const router = express.Router();

/* TEACHER */
router.patch(
  "/teachers/profile/request",
  protect,
  allowRoles("teacher"),
  validate(requestTeacherProfileUpdateSchema),
  requestTeacherProfileUpdate
);

/* ADMIN */
router.post(
  "/admin/teachers/:teacher_id/approve",
  protect,
  allowRoles("school_admin"),
  validate(approveTeacherProfileSchema),
  approveTeacherProfile
);

export default router;
