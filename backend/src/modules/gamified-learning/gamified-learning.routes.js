import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getGamifiedLearning } from "./gamified-learning.controller.js";
import { gamifiedLearningQuerySchema } from "./gamified-learning.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(gamifiedLearningQuerySchema),
  getGamifiedLearning
);

export default router;
