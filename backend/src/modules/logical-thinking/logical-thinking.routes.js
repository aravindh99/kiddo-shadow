import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getLogicalThinking } from "./logical-thinking.controller.js";
import { logicalThinkingQuerySchema } from "./logical-thinking.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(logicalThinkingQuerySchema),
  getLogicalThinking
);

export default router;
