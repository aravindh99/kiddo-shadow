import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { forceFirstLogin } from "../../shared/middlewares/forceFirstLogin.js";
import { validate } from "../../shared/middlewares/validate.js";


import {
  createStudent,
  listStudents,
  listStudentOptions,
  moveStudent,
  updateStudentStatus,
  completeStudentProfile,
  getMyProfile,
  assignStudentsToSection,
  getStudentInsights,
} from "./student.controller.js";

import {
  createStudentSchema,
  completeStudentProfileSchema,
  moveStudentSchema,
  updateStudentStatusSchema,
  assignStudentsToSectionSchema,
} from "./student.schema.js";

const router = express.Router();

function noStore(req, res, next) {
  delete req.headers["if-none-match"];
  delete req.headers["if-modified-since"];
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
}

/* student self */
router.post(
  "/complete-profile",
  protect,
  validate(completeStudentProfileSchema),
  completeStudentProfile
);

router.get("/me", noStore, protect, getMyProfile);

/* admin */
router.post(
  "/",
  protect,
  allowRoles("school_admin"),
  validate(createStudentSchema),
  createStudent
);

router.get(
  "/options",
  protect,
  allowRoles("school_admin", "teacher"),
  listStudentOptions
);

router.get(
  "/teacher/section",
  protect,
  allowRoles("teacher"),
  (async (req, res, next) => {
    const { listStudentsForTeacherSection } = await import("./student.controller.js");
    return listStudentsForTeacherSection(req, res, next);
  })
);

router.get(
  "/:id/insights",
  protect,
  allowRoles("school_admin", "teacher", "super_admin"),
  getStudentInsights
);

router.get(
  "/",
  protect,
  allowRoles("school_admin", "teacher", "super_admin"),
  listStudents
);

router.patch(
  "/:id/move",
  protect,
  allowRoles("school_admin"),
  validate(moveStudentSchema),
  moveStudent
);

router.patch(
  "/:id/status",
  protect,
  allowRoles("school_admin"),
  validate(updateStudentStatusSchema),
  updateStudentStatus
);

router.post(
  "/assign-section",
  protect,
  allowRoles("school_admin"),
  validate(assignStudentsToSectionSchema),
  assignStudentsToSection
);

export default router;
