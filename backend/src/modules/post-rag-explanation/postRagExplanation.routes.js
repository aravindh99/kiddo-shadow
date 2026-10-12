import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../../shared/middlewares/auth.js";
import { explainPostRagAnswer } from "./postRagExplanation.controller.js";

const router = express.Router();

const postRagExplanationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many explanation requests. Please try again later.",
});

router.post("/", postRagExplanationRateLimit, protect, explainPostRagAnswer);

export default router;
