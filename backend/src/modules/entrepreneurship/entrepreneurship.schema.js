import { z } from "zod";
import { CLASS_1112_MODES } from "../class-1112-module-access/class1112ModuleAccess.service.js";

export const entrepreneurshipQuerySchema = z.object({
  query: z.object({
    mode: z.enum(CLASS_1112_MODES).optional(),
    student_id: z.coerce.number().int().positive().optional(),
  }),
});
