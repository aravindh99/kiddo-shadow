import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getIntroCoding } from "./intro-coding.controller.js";
import { introCodingQuerySchema } from "./intro-coding.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(introCodingQuerySchema),
  getIntroCoding
);

export default router;
