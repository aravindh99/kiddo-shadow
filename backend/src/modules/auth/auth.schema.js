import { z } from "zod";

export const loginSchema = z.object({
  username: z.string()
    .min(4, "Username/Email must be at least 4 characters")
    .max(40, "Username/Email must be at most 40 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(32, "Password must be at most 32 characters"),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, "Current password required"),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
});
