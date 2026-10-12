import { z } from "zod";

const CLASS_SCOPE_VALUES = [
  "everyone",
  "prekg",
  "lkg",
  "ukg",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

const classScopeSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.toLowerCase();
  },
  z.union([
    z.number().int().positive(),
    z.enum(CLASS_SCOPE_VALUES),
  ])
);

const optionalSectionIdSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z.coerce.number().int().positive().optional()
);

export const paymentLogsQuerySchema = z.object({
  query: z.object({
    classId: classScopeSchema.optional(),
    sectionId: optionalSectionIdSchema,
  }),
});

export const createPaymentLogsSchema = z.object({
  body: z.object({
    classId: classScopeSchema,
    sectionId: optionalSectionIdSchema,
    amount: z.coerce.number().positive(),
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().max(1000).optional().default(""),
    dueDate: z.string().date().optional(),
  }),
});

export const paymentLogDropdownQuerySchema = z.object({
  query: z.object({
    classId: classScopeSchema.optional(),
  }),
});
