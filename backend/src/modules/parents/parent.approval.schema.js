import { z } from "zod";

/* =========================
   TEACHER: CREATE PARENT + LINK (PENDING)
========================= */
export const teacherCreateParentSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    student_id: z.number().int().positive(),
    relation_type: z.enum(["mother", "father", "guardian"]),
  }),
});

/* =========================
   ADMIN: APPROVE / REJECT
========================= */
export const approveParentSchema = z.object({
  params: z.object({
    parent_id: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    action: z.enum(["approve", "reject"]),
  }),
});
