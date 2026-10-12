import asyncHandler from "../../shared/asyncHandler.js";
import { getIntroCodingService } from "./intro-coding.service.js";

export const getIntroCoding = asyncHandler(async (req, res) => {
  const data = await getIntroCodingService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
