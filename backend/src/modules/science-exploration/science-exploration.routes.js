import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getScienceExploration } from "./science-exploration.controller.js";
import { scienceExplorationQuerySchema } from "./science-exploration.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(scienceExplorationQuerySchema),
  getScienceExploration
);

export default router;
