import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  parentChildrenQuerySchema,
  parentDashboardSchema,
} from "./parent.dashboard.schema.js";

import { getParentChildren } from "./parent.children.controller.js";
import { getParentDashboard } from "./parent.dashboard.controller.js";

const router = express.Router();

/* parent → children list */
router.get(
  "/parents/children",
  protect,
  allowRoles("parent"),
  validate(parentChildrenQuerySchema),
  getParentChildren
);

/* parent → daily dashboard */
router.get(
  "/parents/dashboard",
  protect,
  allowRoles("parent"),
  validate(parentDashboardSchema),
  getParentDashboard
);

export default router;
