import asyncHandler from "../../shared/asyncHandler.js";
import { getScienceMathLearningService } from "./scienceMath.service.js";

export const getScienceMathLearning = asyncHandler(async (req, res) => {
  const data = await getScienceMathLearningService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
