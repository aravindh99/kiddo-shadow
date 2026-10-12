import { z } from "zod";

export const attendanceAnalyticsQuerySchema = z.object({
  query: z.object({
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    class_id: z.string().optional(),   // teacher only
    section_id: z.string().optional(), // teacher only
    student_id: z.string().optional(), // teacher only
  }),
});
