import asyncHandler from "../../shared/asyncHandler.js";
import { getEntrepreneurshipService } from "./entrepreneurship.service.js";

export const getEntrepreneurship = asyncHandler(async (req, res) => {
  const data = await getEntrepreneurshipService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
