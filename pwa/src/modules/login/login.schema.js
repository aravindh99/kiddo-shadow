import { z } from "zod";

export const loginSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .min(4, "Username must be at least 4 characters")
    .max(40, "Username must be at most 40 characters"),
  password: z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(32, "Password must be at most 32 characters"),
});
