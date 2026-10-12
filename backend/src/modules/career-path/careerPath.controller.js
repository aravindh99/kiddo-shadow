import asyncHandler from "../../shared/asyncHandler.js";
import { getCareerPathService } from "./careerPath.service.js";

export const getCareerPath = asyncHandler(async (req, res) => {
  const data = await getCareerPathService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
