import asyncHandler from "../../shared/asyncHandler.js";
import { getCompetitiveExamService } from "./competitive.service.js";

export const getCompetitiveExam = asyncHandler(async (req, res) => {
  const data = await getCompetitiveExamService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
