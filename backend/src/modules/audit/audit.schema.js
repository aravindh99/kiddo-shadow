import { z } from "zod";

export const listAuditLogsSchema = z.object({
  query: z.object({
    entity_type: z.string().optional(),
    entity_id: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    module: z.string().optional(),
    action: z.string().optional(),
    status: z.string().optional(),
    user_id: z.string().optional(),
    role: z.string().optional(),
    search: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});
