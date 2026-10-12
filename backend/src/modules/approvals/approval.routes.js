import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import { listPendingApprovalsSchema } from "./approval.schema.js";
import {
  getTeacherPendingApprovals,
  getAdminPendingApprovals,
  approveRejectRequest,
  getTeacherApprovalHistory,
} from "./approval.controller.js";

const router = express.Router();

/* =========================
   TEACHER
========================= */
router.get(
  "/teachers/approvals/pending",
  protect,
  allowRoles("teacher"),
  validate(listPendingApprovalsSchema),
  getTeacherPendingApprovals
);

router.get(
  "/teachers/approvals/history",
  protect,
  allowRoles("teacher"),
  getTeacherApprovalHistory
);

router.post(
  "/teachers/approvals/:type/:id/:action",
  protect,
  allowRoles("teacher"),
  approveRejectRequest
);

/* =========================
   ADMIN
========================= */
router.get(
  "/admin/approvals/pending",
  protect,
  allowRoles("school_admin"),
  validate(listPendingApprovalsSchema),
  getAdminPendingApprovals
);

router.post(
  "/admin/approvals/:type/:id/:action",
  protect,
  allowRoles("school_admin"),
  approveRejectRequest
);

export default router;
