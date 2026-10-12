import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getCreativeSkills } from "./creative.controller.js";
import { creativeQuerySchema } from "./creative.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(creativeQuerySchema),
  getCreativeSkills
);

export default router;
