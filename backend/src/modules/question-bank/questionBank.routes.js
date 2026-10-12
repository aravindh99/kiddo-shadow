import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {
  createQuestionBankQuiz,
  getQuestionBankExams,
} from "./questionBank.controller.js";

const router = express.Router();

router.use(protect);

router.get(
  "/exams",
  allowRoles("student", "teacher", "school_admin"),
  getQuestionBankExams
);

router.post(
  "/generate",
  allowRoles("student", "teacher"),
  createQuestionBankQuiz
);

export default router;
