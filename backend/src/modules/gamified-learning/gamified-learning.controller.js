import asyncHandler from "../../shared/asyncHandler.js";
import { getGamifiedLearningService } from "./gamified-learning.service.js";

export const getGamifiedLearning = asyncHandler(async (req, res) => {
  const data = await getGamifiedLearningService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
