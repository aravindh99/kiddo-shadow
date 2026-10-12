import asyncHandler from "../../shared/asyncHandler.js";
import { getLogicalThinkingService } from "./logical-thinking.service.js";

export const getLogicalThinking = asyncHandler(async (req, res) => {
  const data = await getLogicalThinkingService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
