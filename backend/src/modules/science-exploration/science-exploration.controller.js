import asyncHandler from "../../shared/asyncHandler.js";
import { getScienceExplorationService } from "./science-exploration.service.js";

export const getScienceExploration = asyncHandler(async (req, res) => {
  const data = await getScienceExplorationService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
