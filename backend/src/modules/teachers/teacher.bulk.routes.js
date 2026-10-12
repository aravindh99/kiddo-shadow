import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import { bulkApproveTeachersSchema } from "./teacher.bulk.schema.js";
import { bulkApproveTeachers } from "./teacher.bulk.controller.js";

const router = express.Router();

router.post(
  "/admin/teachers/bulk-approve",
  protect,
  allowRoles("school_admin"),
  validate(bulkApproveTeachersSchema),
  bulkApproveTeachers
);

export default router;
