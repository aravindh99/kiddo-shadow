import asyncHandler from "../../shared/asyncHandler.js";
import { getAdvancedCodingService } from "./advancedCoding.service.js";

export const getAdvancedCoding = asyncHandler(async (req, res) => {
  const data = await getAdvancedCodingService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
