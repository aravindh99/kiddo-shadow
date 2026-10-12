import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {
  assignReference,
  clearReference,
  createInvoice,
  createReference,
  invoice,
  invoices,
  overview,
  references,
  schoolSummary,
  updateReference,
} from "./billing.controller.js";

const router = express.Router();

router.use(protect, allowRoles("super_admin"));

router.get("/schools", overview);
router.get("/schools/:schoolId", schoolSummary);
router.patch("/schools/:schoolId/reference", assignReference);
router.delete("/schools/:schoolId/reference", clearReference);

router.get("/references", references);
router.post("/references", createReference);
router.patch("/references/:id", updateReference);

router.get("/invoices", invoices);
router.get("/invoices/:id", invoice);
router.post("/invoices", createInvoice);

export default router;
