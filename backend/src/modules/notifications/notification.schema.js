import { z } from "zod";

/* admin / teacher: create announcement */
export const createNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),

  target_role: z.enum(["teacher", "parent", "student", "all"]),

  class_id: z.number().int().positive().optional(),
  section_id: z.number().int().positive().optional(),
});

export const updateNotificationSchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  target_role: z.enum(["teacher", "parent", "student", "all"]).optional(),
  class_id: z.number().int().positive().optional().nullable(),
  section_id: z.number().int().positive().optional().nullable(),
});
/* parent / teacher: acknowledge */
export const acknowledgeNotificationSchema = z.object({});
