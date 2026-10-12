import { z } from "zod";

/* =========================
   STUDENT: REQUEST PROFILE UPDATE
========================= */
export const requestStudentProfileUpdateSchema = z.object({
  body: z.object({
    avatar_url: z.string().optional().or(z.literal("")).or(z.null()),
    dob: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    father_name: z.string().optional(),
    mother_name: z.string().optional(),
    guardian_name: z.string().optional(),
    address: z.string().optional(),
    blood_group: z.string().optional(),
    aadhar_no: z.string().optional(),
    father_occupation: z.string().optional(),
    mother_occupation: z.string().optional(),
    family_income: z.number().optional(),
  }),
});

/* =========================
   TEACHER: APPROVE / REJECT
========================= */
export const approveStudentProfileSchema = z.object({
  params: z.object({
    student_id: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    action: z.enum(["approve", "reject"]),
    remark: z.string().optional(),
  }).refine(
    (data) => data.action === "approve" || data.remark,
    {
      message: "Rejection reason is required",
      path: ["remark"],
    }
  ),
});
