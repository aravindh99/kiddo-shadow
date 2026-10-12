import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { saveTimetableSchema } from "./timetable.schema.js";
import {
  saveTimetable,
  getSectionTimetable,
  getTeacherTimetable,
  approveTimetable,
} from "./timetable.controller.js";
import { approveTimetableSchema } from "./timetable.schema.js";

const router = express.Router();

router.use(protect);

// Admin: Approve/Reject timetable
router.post(
  "/approve",
  allowRoles("school_admin"),
  validate(approveTimetableSchema),
  approveTimetable
);

// Admin or Teacher: Save timetable
router.post(
  "/",
  allowRoles("school_admin", "teacher"),
  validate(saveTimetableSchema),
  saveTimetable
);

// Student/Parent: View section timetable
router.get("/section", getSectionTimetable);

// Teacher: View own timetable
router.get("/teacher/me", allowRoles("teacher"), getTeacherTimetable);

export default router;
