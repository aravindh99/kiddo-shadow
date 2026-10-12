import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { createQuiz, generateQuiz } from "./quiz.controller.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  allowRoles("teacher", "school_admin"),
  createQuiz
);

router.post(
  "/generate",
  allowRoles("student", "teacher"),
  generateQuiz
);

export default router;
