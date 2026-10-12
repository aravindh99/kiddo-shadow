import { z } from "zod";

const emptyToUndefined = (val) => (val === "" ? undefined : val);



/* admin: status */
export const updateTeacherStatusSchema = z.object({
  is_active: z.boolean(),
});

/* teacher: complete profile */
export const completeTeacherProfileSchema = z.object({
  name: z.string()
    .min(3, "Please enter a valid full name.")
    .max(50, "Please enter a valid full name.")
    .regex(/^[A-Za-z]+( [A-Za-z]+)*$/, "Please enter a valid full name.")
    .transform(val => val.trim()),
  phone: z.string()
    .length(10, "Please enter a valid 10-digit mobile number.")
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number."),
  gender: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Please select your gender." })
    })
  ).optional(),
  designation: z.preprocess(
    emptyToUndefined,
    z.string()
      .min(2, "Please enter a valid designation.")
      .max(30, "Please enter a valid designation.")
      .regex(/^[A-Za-z\s]+$/, "Please enter a valid designation.")
      .transform(val => val.trim())
  ).optional(),
  qualification: z.preprocess(
    emptyToUndefined,
    z.string()
      .min(2, "Please enter your qualification.")
      .max(50, "Please enter your qualification.")
      .regex(/^[A-Za-z\s.]+$/, "Please enter your qualification.")
      .transform(val => val.trim())
  ).optional(),
  experience: z.preprocess(
    emptyToUndefined,
    z.coerce.number()
      .min(0, "Please enter valid experience between 0 and 50 years.")
      .max(50, "Please enter valid experience between 0 and 50 years.")
  ).optional(),
  email: z.preprocess(
    emptyToUndefined,
    z.string()
      .email("Please enter a valid email address.")
      .transform(val => val.trim().toLowerCase())
  ).optional(),
  avatar_url: z.string().optional().or(z.literal("")).or(z.null()),
});
