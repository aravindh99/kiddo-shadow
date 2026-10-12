import { z } from "zod";

export const createSectionSchema = z.object({
  class_id: z.number().int().positive(),
  name: z.string().min(1).max(10),
});

export const updateSectionStatusSchema = z.object({
  is_active: z.boolean(),
});
