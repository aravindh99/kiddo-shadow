import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getCareerDiscovery } from "./career.controller.js";
import { careerQuerySchema } from "./career.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(careerQuerySchema),
  getCareerDiscovery
);

export default router;
