import asyncHandler from "../../shared/asyncHandler.js";
import { getCommunicationSkillsService } from "./communication.service.js";

export const getCommunicationSkills = asyncHandler(async (req, res) => {
  const data = await getCommunicationSkillsService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
