import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { bulkCreateData } from "./bulk.controller.js";
import { bulkCreateDataSchema } from "./bulk.schema.js";

const router = express.Router();

router.post(
  "/bulk-create",
  protect,
  allowRoles("school_admin"),
  validate(bulkCreateDataSchema),
  bulkCreateData
);

// POST /admin/bulk/create
router.post("/create", protect, allowRoles("school_admin"), bulkCreateData);

export default router;
