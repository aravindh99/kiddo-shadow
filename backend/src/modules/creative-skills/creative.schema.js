import { z } from "zod";
import { CLASS_89_MODES } from "../class-89-module-access/class89ModuleAccess.service.js";

export const creativeQuerySchema = z.object({
  query: z.object({
    mode: z.enum(CLASS_89_MODES).optional(),
    student_id: z.coerce.number().int().positive().optional(),
  }),
});
