import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {validate} from "../../shared/middlewares/validate.js";

import {
  createSectionSchema,
  updateSectionStatusSchema,
} from "./section.schema.js";

import {
  createSection,
  listSections,
  updateSectionStatus,
} from "./section.controller.js";

const router = express.Router();

/* =========================
   SCHOOL ADMIN
========================= */
router.post(
  "/",
  protect,
  allowRoles("school_admin"),
  validate(createSectionSchema),
  createSection
);

router.get(
  "/classes/:class_id/sections",
  protect,
  allowRoles("school_admin", "teacher"),
  listSections
);

router.patch(
  "/:id/status",
  protect,
  allowRoles("school_admin"),
  validate(updateSectionStatusSchema),
  updateSectionStatus
);

export default router;
