import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getStudyStrategy } from "./strategy.controller.js";
import { strategyQuerySchema } from "./strategy.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(strategyQuerySchema),
  getStudyStrategy
);

export default router;
