import asyncHandler from "../../shared/asyncHandler.js";
import { getGkBuilderService } from "./gk-builder.service.js";

export const getGkBuilder = asyncHandler(async (req, res) => {
  const data = await getGkBuilderService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
