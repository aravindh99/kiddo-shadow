import { generateAiFollowup } from "./aiFollowup.service.js";

export const createAiFollowup = async (req, res) => {
  try {
    const result = await generateAiFollowup({
      originalQuestion: req.body?.originalQuestion,
      previousAnswer: req.body?.previousAnswer,
      followupType: req.body?.followupType,
    });

    return res.json(result);
  } catch (err) {
    const statusCode = err?.statusCode || 500;

    console.error(
      "AI_FOLLOWUP_ERROR",
      err?.message || err
    );

    return res.status(statusCode).json({
      message:
        statusCode === 500
          ? "Failed to generate follow-up answer"
          : err.message,
    });
  }
};