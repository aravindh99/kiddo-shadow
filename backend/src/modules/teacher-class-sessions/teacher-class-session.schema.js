import { z } from "zod";

export const startClassSessionSchema = z
  .object({
    teacher_assignment_id: z.coerce.number().int().positive().optional(),
    timetable_id: z.coerce.number().int().positive().optional(),
    subject_id: z.coerce.number().int().positive().optional(), // accepted but ignored; kept for older clients
  })
  .refine((val) => val.teacher_assignment_id || val.timetable_id, {
    message: "teacher_assignment_id or timetable_id is required",
  });

export const endClassSessionSchema = z.object({});

export const listClassSessionSchema = z.object({
  query: z.object({
    date: z.string().optional(), // ISO date (YYYY-MM-DD)
  }),
});
