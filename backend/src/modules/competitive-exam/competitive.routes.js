import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getCompetitiveExam } from "./competitive.controller.js";
import { competitiveQuerySchema } from "./competitive.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(competitiveQuerySchema),
  getCompetitiveExam
);

export default router;
