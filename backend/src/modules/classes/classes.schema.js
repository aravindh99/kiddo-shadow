// src/modules/classes/classes.schema.js
import { z } from "zod";

export const createClassSchema = z.object({
  class_name: z.string().trim().min(1).max(50),
});

export const updateClassSchema = z.object({
  class_name: z.string().trim().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});
