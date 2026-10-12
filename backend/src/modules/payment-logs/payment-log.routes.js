import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createPaymentLogsSchema,
  paymentLogDropdownQuerySchema,
  paymentLogsQuerySchema,
} from "./payment-log.schema.js";
import {
  createPaymentLogs,
  getParentPaymentLogs,
  getPaymentLogDropdownOptions,
  getPaymentLogs,
} from "./payment-log.controller.js";

const router = express.Router();

router.get(
  "/options",
  protect,
  allowRoles("school_admin"),
  validate(paymentLogDropdownQuerySchema),
  getPaymentLogDropdownOptions
);

router.get(
  "/",
  protect,
  allowRoles("school_admin"),
  validate(paymentLogsQuerySchema),
  getPaymentLogs
);

router.post(
  "/",
  protect,
  allowRoles("school_admin"),
  validate(createPaymentLogsSchema),
  createPaymentLogs
);

router.get(
  "/me",
  protect,
  allowRoles("parent"),
  getParentPaymentLogs
);

export default router;
