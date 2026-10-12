import { z } from "zod";

export const createSubjectSchema = z.object({
    name: z.string().min(2).max(100),
    code: z.string().min(2).max(20).optional(),
    category: z.enum(["theory", "practical", "both"]).default("theory"),
});

export const updateSubjectSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(2).max(20).optional(),
    category: z.enum(["theory", "practical", "both"]).optional(),
});
