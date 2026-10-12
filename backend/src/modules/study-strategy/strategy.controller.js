import asyncHandler from "../../shared/asyncHandler.js";
import { getStudyStrategyService } from "./strategy.service.js";

export const getStudyStrategy = asyncHandler(async (req, res) => {
  const data = await getStudyStrategyService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
