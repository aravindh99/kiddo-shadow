import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import { bulkApproveParentsSchema } from "./parent.bulk.schema.js";
import { bulkApproveParents } from "./parent.bulk.controller.js";

const router = express.Router();

router.post(
  "/admin/parents/bulk-approve",
  protect,
  allowRoles("school_admin"),
  validate(bulkApproveParentsSchema),
  bulkApproveParents
);

export default router;
