import { z } from "zod";

export const createExamSchema = z.object({
  class_id: z.number().int().positive(),
  name: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const lockExamSchema = z.object({
  is_locked: z.literal(true),
});

export const createExamTimetableSchema = z.object({
  entries: z.array(z.object({
    subject_id: z.number().int().positive(),
    exam_date: z.string(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    max_marks: z.number().int().optional(),
    passing_marks: z.number().int().optional(),
  }))
});
