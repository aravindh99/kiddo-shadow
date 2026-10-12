import { z } from "zod";

const sectionEntrySchema = z.object({
  name: z.string(),
  students: z.number().int().min(1),
});

const classEntrySchema = z.object({
  name: z.string(),
  sections: z.array(sectionEntrySchema).min(1),
});

export const bulkCreateDataSchema = z.object({
  classes: z.array(classEntrySchema).min(1),
  teacher_count: z.number().int().min(1).optional(),
});
