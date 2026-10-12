import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getCareerPath } from "./careerPath.controller.js";
import { careerPathQuerySchema } from "./careerPath.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(careerPathQuerySchema),
  getCareerPath
);

export default router;
