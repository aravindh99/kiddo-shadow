import asyncHandler from "../../shared/asyncHandler.js";
import { submitHomeworkService } from "./homework-submission.service.js";

/* STUDENT: SUBMIT / UPDATE */
export const submitHomework = asyncHandler(async (req, res) => {
  const submission = await submitHomeworkService({
    school_id: req.user.school_id,
    student_id: req.user.student_id,
    homework_id: Number(req.params.homework_id),
    ...req.body,
  });

  res.json({
    success: true,
    data: submission,
  });
});
