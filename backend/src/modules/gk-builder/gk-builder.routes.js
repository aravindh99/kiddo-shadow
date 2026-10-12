import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getGkBuilder } from "./gk-builder.controller.js";
import { gkBuilderQuerySchema } from "./gk-builder.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(gkBuilderQuerySchema),
  getGkBuilder
);

export default router;
