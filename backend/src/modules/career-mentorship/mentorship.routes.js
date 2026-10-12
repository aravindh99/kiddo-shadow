import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getMentorship } from "./mentorship.controller.js";
import { mentorshipQuerySchema } from "./mentorship.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(mentorshipQuerySchema),
  getMentorship
);

export default router;
