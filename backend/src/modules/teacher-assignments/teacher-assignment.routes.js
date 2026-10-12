import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  assignTeacherSchema,
  updateTeacherAssignmentSchema,
} from "./teacher-assignment.schema.js";
import {
  assignTeacher,
  listAssignments,
  getTeacherAssignments,
  getSectionAssignments,
  updateAssignment,
  deleteAssignment,
} from "./teacher-assignment.controller.js";

const router = express.Router();

router.use(protect);

/* ADMIN: CREATE ASSIGNMENT */
router.post(
  "/",
  allowRoles("school_admin"),
  validate(assignTeacherSchema),
  assignTeacher
);

/* ADMIN: LIST ALL ASSIGNMENTS */
router.get("/", allowRoles("school_admin"), listAssignments);

/* TEACHER/ADMIN: GET TEACHER'S ASSIGNMENTS */
router.get(
  "/teacher/me",
  allowRoles("teacher"),
  getTeacherAssignments
);
router.get(
  "/teacher/:teacherId",
  allowRoles("school_admin", "teacher"),
  getTeacherAssignments
);

/* ADMIN: GET SECTION ASSIGNMENTS */
router.get("/section/:sectionId", allowRoles("school_admin", "teacher"), getSectionAssignments);

/* ADMIN: UPDATE ASSIGNMENT */
router.patch(
  "/:id",
  allowRoles("school_admin"),
  validate(updateTeacherAssignmentSchema),
  updateAssignment
);

/* ADMIN: DELETE ASSIGNMENT */
router.delete("/:id", allowRoles("school_admin"), deleteAssignment);

export default router;

