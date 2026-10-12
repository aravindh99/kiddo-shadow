import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getAdvancedExam } from "./advancedExam.controller.js";
import { advancedExamQuerySchema } from "./advancedExam.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(advancedExamQuerySchema),
  getAdvancedExam
);

export default router;
