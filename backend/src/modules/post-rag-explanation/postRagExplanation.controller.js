import asyncHandler from "../../shared/asyncHandler.js";
import {
  generatePostRagExplanation,
  logPostRagExplanationError,
} from "./postRagExplanation.service.js";

export const explainPostRagAnswer = asyncHandler(async (req, res) => {
  res.type("text/plain");

  try {
    console.log("POST_RAG_EXPLANATION_CONTROLLER_ENTRY", {
      body: req.body,
      hasQuestion: Boolean(req.body?.question || req.body?.originalQuestion),
      hasAnswer: Boolean(req.body?.answer),
      mode: req.body?.mode,
      userId: req.user?.id || null,
    });

    const explanation = await generatePostRagExplanation({
      question: req.body?.question,
      originalQuestion: req.body?.originalQuestion,
      answer: req.body?.answer,
      mode: req.body?.mode,
    });

    console.log("POST_RAG_EXPLANATION_CONTROLLER_SUCCESS", {
      explanationLength: String(explanation || "").length,
    });

    return res.send(explanation);
  } catch (err) {
    logPostRagExplanationError("POST_RAG_EXPLANATION_CONTROLLER_ERROR", err);
    const statusCode = err?.statusCode || 500;
    return res.status(statusCode).send(err?.message || "Unable to generate explanation.");
  }
});
