import asyncHandler from "../../shared/asyncHandler.js";
import { relatedQuestionService } from "./relatedQuestion.service.js";
import { storeRelatedQuestionState } from "./relatedQuestionState.js";

export const getRelatedQuestions = asyncHandler(async (req, res) => {
  const question = req.body?.question;
  const questions = await relatedQuestionService.generate(question);
  storeRelatedQuestionState(req, {
    originalQuestion: question,
    questions,
  });
  res.json({ questions });
});
