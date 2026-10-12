import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {
  createTeacherAssignedTest,
  getAssignedTestLockStatus,
  getStudentAssignedTest,
  getTeacherAssignedTest,
  listParentAssignedTests,
  listStudentAssignedTests,
  listTeacherAssignedTests,
  reviewAssignedTestSubmission,
  startAssignedTest,
  submitAssignedTest,
} from "./ai-test-assignment.controller.js";

const router = express.Router();

router.use(protect);

router.post("/teacher/ai-tests", allowRoles("teacher"), createTeacherAssignedTest);
router.get("/teacher/ai-tests", allowRoles("teacher"), listTeacherAssignedTests);
router.get("/teacher/ai-tests/:id", allowRoles("teacher"), getTeacherAssignedTest);
router.patch(
  "/teacher/ai-tests/:id/submissions/:submissionId/review",
  allowRoles("teacher"),
  reviewAssignedTestSubmission
);

router.get("/student/ai-tests/lock-status", allowRoles("student"), getAssignedTestLockStatus);
router.get("/student/ai-tests", allowRoles("student"), listStudentAssignedTests);
router.get("/student/ai-tests/:id", allowRoles("student"), getStudentAssignedTest);
router.post("/student/ai-tests/:id/start", allowRoles("student"), startAssignedTest);
router.post("/student/ai-tests/:id/submit", allowRoles("student"), submitAssignedTest);

router.get("/parent/ai-tests", allowRoles("parent"), listParentAssignedTests);

export default router;

