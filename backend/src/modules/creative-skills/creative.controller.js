import asyncHandler from "../../shared/asyncHandler.js";
import { getCreativeSkillsService } from "./creative.service.js";

export const getCreativeSkills = asyncHandler(async (req, res) => {
  const data = await getCreativeSkillsService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
