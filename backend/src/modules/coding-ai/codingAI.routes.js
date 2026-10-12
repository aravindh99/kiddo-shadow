import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getCodingAI } from "./codingAI.controller.js";
import { codingAIQuerySchema } from "./codingAI.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(codingAIQuerySchema),
  getCodingAI
);

export default router;
