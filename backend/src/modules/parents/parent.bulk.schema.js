import { z } from "zod";

export const bulkApproveParentsSchema = z.object({
  body: z.object({
    parent_ids: z.array(z.number().int().positive()).min(1),
    action: z.enum(["approve", "reject"]),
  }),
});
