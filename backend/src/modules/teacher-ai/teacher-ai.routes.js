import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {
  teacherAiHandler,
  generateQuestionPaper,
  generateLessonSummary,
} from "./teacher-ai.controller.js";

const router = express.Router();

router.post(
  "/teacher/ai",
  protect,
  allowRoles("teacher"),
  teacherAiHandler
);

router.post(
  "/teacher/ai/question-paper",
  protect,
  allowRoles("teacher"),
  generateQuestionPaper
);

router.post(
  "/teacher/ai/lesson-summary",
  protect,
  allowRoles("teacher"),
  generateLessonSummary
);

export default router;
