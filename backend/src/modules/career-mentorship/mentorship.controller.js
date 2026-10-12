import asyncHandler from "../../shared/asyncHandler.js";
import { getMentorshipService } from "./mentorship.service.js";

export const getMentorship = asyncHandler(async (req, res) => {
  const data = await getMentorshipService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
