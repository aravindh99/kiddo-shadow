import { z } from "zod";
import { FOUNDATION_MODES } from "../foundation-module-access/foundation-module-access.service.js";

export const logicalThinkingQuerySchema = z.object({
  query: z.object({
    mode: z.enum(FOUNDATION_MODES).optional(),
    student_id: z.coerce.number().int().positive().optional(),
  }),
});
