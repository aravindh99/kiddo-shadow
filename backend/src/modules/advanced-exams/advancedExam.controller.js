import asyncHandler from "../../shared/asyncHandler.js";
import { getAdvancedExamService } from "./advancedExam.service.js";

export const getAdvancedExam = asyncHandler(async (req, res) => {
  const data = await getAdvancedExamService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
