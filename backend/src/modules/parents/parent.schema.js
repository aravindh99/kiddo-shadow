import { z } from "zod";

/* =========================
   ADMIN: CREATE PARENT + LINK
========================= */
export const createParentAndLinkSchema = z.object({
  student_id: z.number().int().positive(),
  relation_type: z.enum(["mother", "father", "guardian"]).default("guardian"),
});

/* =========================
   ADMIN: LINK EXISTING PARENT
========================= */
export const linkExistingParentSchema = z.object({
  parent_user_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  relation_type: z.enum(["mother", "father", "guardian"]),
});

/* =========================
   PARENT: UPDATE OWN PROFILE
========================= */
export const updateParentProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().optional(),
  relation_type: z.enum(["mother", "father", "guardian"]).optional(),
});
