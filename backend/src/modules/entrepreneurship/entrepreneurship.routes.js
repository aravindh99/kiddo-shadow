import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getEntrepreneurship } from "./entrepreneurship.controller.js";
import { entrepreneurshipQuerySchema } from "./entrepreneurship.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(entrepreneurshipQuerySchema),
  getEntrepreneurship
);

export default router;
