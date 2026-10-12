import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../../shared/middlewares/auth.js";
import { getRelatedQuestions } from "./relatedQuestion.controller.js";

const router = express.Router();
const relatedQuestionRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many related-question requests. Please try again later." },
});

router.post("/", relatedQuestionRateLimit, protect, getRelatedQuestions);

export default router;
