import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { getCommunicationSkills } from "./communication.controller.js";
import { communicationQuerySchema } from "./communication.schema.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("student", "parent"),
  validate(communicationQuerySchema),
  getCommunicationSkills
);

export default router;
