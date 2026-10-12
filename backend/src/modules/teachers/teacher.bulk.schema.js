import { z } from "zod";

export const bulkApproveTeachersSchema = z.object({
  body: z.object({
    teacher_ids: z.array(z.number().int().positive()).min(1),
    action: z.enum(["approve", "reject"]),
  }),
});
