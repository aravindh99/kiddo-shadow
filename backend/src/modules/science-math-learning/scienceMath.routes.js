import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getScienceMathLearning } from "./scienceMath.controller.js";
import { scienceMathQuerySchema } from "./scienceMath.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(scienceMathQuerySchema),
  getScienceMathLearning
);

export default router;
