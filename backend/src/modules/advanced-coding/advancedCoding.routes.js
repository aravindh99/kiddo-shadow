import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getAdvancedCoding } from "./advancedCoding.controller.js";
import { advancedCodingQuerySchema } from "./advancedCoding.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(advancedCodingQuerySchema),
  getAdvancedCoding
);

export default router;
