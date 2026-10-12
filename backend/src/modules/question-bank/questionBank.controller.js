import asyncHandler from "../../shared/asyncHandler.js";
import {
  generateQuestionBankQuiz,
  listQuestionBankExams,
} from "./questionBank.service.js";

export const getQuestionBankExams = asyncHandler(async (req, res) => {
  const items = await listQuestionBankExams();
  res.json({ success: true, items });
});

export const createQuestionBankQuiz = asyncHandler(async (req, res) => {
  const { exam, numQuestions, totalMarks, aiMode, subject } = req.body;
  const result = await generateQuestionBankQuiz({
    user: req.user,
    exam,
    numQuestions,
    totalMarks,
    aiMode,
    subject,
  });

  res.json(result);
});
