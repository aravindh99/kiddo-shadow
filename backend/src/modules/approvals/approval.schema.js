import { z } from "zod";

export const listPendingApprovalsSchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    offset: z.string().optional(),

    // filters
    class_id: z.string().optional(),
    teacher_id: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
  }),
});
