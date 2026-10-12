import asyncHandler from "../../shared/asyncHandler.js";
import { getCodingAIService } from "./codingAI.service.js";

export const getCodingAI = asyncHandler(async (req, res) => {
  const data = await getCodingAIService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
