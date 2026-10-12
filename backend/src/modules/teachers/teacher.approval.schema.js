import { z } from "zod";

/* =========================
   TEACHER: REQUEST PROFILE UPDATE
========================= */
export const requestTeacherProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    qualification: z.string().optional(),
    experience_years: z.number().int().min(0).optional(),
    address: z.string().optional(),
  }),
});

/* =========================
   ADMIN: APPROVE / REJECT
========================= */
export const approveTeacherProfileSchema = z.object({
  params: z.object({
    teacher_id: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    action: z.enum(["approve", "reject"]),
  }),
});
