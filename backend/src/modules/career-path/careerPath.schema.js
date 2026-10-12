import { z } from "zod";
import { CLASS_10_MODES } from "../class-10-module-access/class10ModuleAccess.service.js";

export const careerPathQuerySchema = z.object({
  query: z.object({
    mode: z.enum(CLASS_10_MODES).optional(),
    student_id: z.coerce.number().int().positive().optional(),
  }),
});
