import { z } from "zod";

/* teacher: create report card */
export const createReportCardSchema = z.object({
  student_id: z.number().int().positive(),
  exam_id: z.number().int().positive(),
});

/* teacher: save marks */
export const saveReportCardMarksSchema = z.object({
  marks: z
    .array(
      z.object({
        subject_id: z.number().int().positive(),
        marks_obtained: z.number(),
        max_marks: z.number().positive(),
      })
    )
    .min(1),
});

/* teacher: publish */
export const publishReportCardSchema = z.object({
  remarks: z.string().optional(),
});
