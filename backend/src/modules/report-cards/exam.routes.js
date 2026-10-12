import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import { allowRoles } from "../../shared/middlewares/role.js";

import {
  createExamSchema,
  lockExamSchema,
  createExamTimetableSchema,
} from "./exam.schema.js";
import {
  createExam,
  lockExam,
  listExamsByClass,
  addTimetableEntry,
  listExamTimetable,
} from "./exam.controller.js";

const router = express.Router();

router.use(protect);

/* teacher/admin */
router.post(
  "/",
  allowRoles("teacher", "school_admin"),
  validate(createExamSchema),
  createExam
);

router.post(
  "/:id/lock",
  allowRoles("school_admin"),
  validate(lockExamSchema),
  lockExam
);

/* student/parent/teacher */
router.get("/", listExamsByClass);

/* Timetable management */
router.post(
  "/:id/timetable",
  allowRoles("teacher", "school_admin"),
  validate(createExamTimetableSchema),
  addTimetableEntry
);

router.get(
  "/:id/timetable",
  listExamTimetable
);

export default router;
