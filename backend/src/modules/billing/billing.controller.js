import asyncHandler from "../../shared/asyncHandler.js";
import {
  assignSchoolReference,
  clearSchoolReference,
  createBillingInvoice,
  createBillingReference,
  getBillingInvoice,
  getBillingOverview,
  getSchoolBillingSummary,
  listBillingInvoices,
  listBillingReferences,
  updateBillingReference,
} from "./billing.service.js";

export const overview = asyncHandler(async (req, res) => {
  res.json(await getBillingOverview({ search: req.query.search }));
});

export const schoolSummary = asyncHandler(async (req, res) => {
  res.json(await getSchoolBillingSummary(req.params.schoolId));
});

export const references = asyncHandler(async (req, res) => {
  res.json(await listBillingReferences());
});

export const createReference = asyncHandler(async (req, res) => {
  res.status(201).json(await createBillingReference(req.body));
});

export const updateReference = asyncHandler(async (req, res) => {
  res.json(await updateBillingReference(req.params.id, req.body));
});

export const assignReference = asyncHandler(async (req, res) => {
  res.json(await assignSchoolReference(req.params.schoolId, req.body.reference_id));
});

export const clearReference = asyncHandler(async (req, res) => {
  res.json(await clearSchoolReference(req.params.schoolId));
});

export const invoices = asyncHandler(async (req, res) => {
  res.json(await listBillingInvoices(req.query.school_id));
});

export const invoice = asyncHandler(async (req, res) => {
  res.json(await getBillingInvoice(req.params.id));
});

export const createInvoice = asyncHandler(async (req, res) => {
  res.status(201).json(await createBillingInvoice({ ...req.body, generated_by: req.user?.id }));
});
