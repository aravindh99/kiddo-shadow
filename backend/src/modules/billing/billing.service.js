import { Op, fn, col } from "sequelize";
import AppError from "../../shared/appError.js";
import School from "../schools/school.model.js";
import Student from "../students/student.model.js";
import BillingReference from "./billing-reference.model.js";
import BillingInvoice from "./billing-invoice.model.js";

const DEFAULT_GST_PERCENTAGE = Number(process.env.BILLING_GST_PERCENTAGE || 18);
const DEFAULT_RATE_PER_STUDENT = Number(process.env.BILLING_RATE_PER_STUDENT || 0);

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function getBillingMonth(value = "") {
  if (/^\d{4}-\d{2}$/.test(String(value))) return String(value);
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function invoiceNumber(schoolId, billingMonth) {
  return `KS-${String(billingMonth).replace("-", "")}-${String(schoolId).padStart(5, "0")}`;
}

function serializeInvoice(invoice) {
  if (!invoice) return null;
  const plain = typeof invoice.get === "function" ? invoice.get({ plain: true }) : invoice;
  return {
    ...plain,
    student_count: Number(plain.student_count || 0),
    rate_per_student: roundMoney(plain.rate_per_student),
    base_amount: roundMoney(plain.base_amount),
    commission_percentage: roundMoney(plain.commission_percentage ?? plain.reference_percentage),
    reference_percentage: roundMoney(plain.reference_percentage ?? plain.commission_percentage),
    commission_amount: roundMoney(plain.commission_amount),
    taxable_amount: roundMoney(plain.taxable_amount),
    gst_percentage: roundMoney(plain.gst_percentage),
    gst_amount: roundMoney(plain.gst_amount),
    total_amount: roundMoney(plain.total_amount),
  };
}

function buildBilling(school, studentCount) {
  const ratePerStudent = Math.max(0, DEFAULT_RATE_PER_STUDENT);
  const baseAmount = roundMoney(studentCount * ratePerStudent);
  const referencePercentage = Math.max(0, toNumber(school.reference_percentage));
  const commissionAmount = roundMoney((baseAmount * referencePercentage) / 100);
  const taxableAmount = roundMoney(Math.max(0, baseAmount - commissionAmount));
  const gstPercentage = Math.max(0, DEFAULT_GST_PERCENTAGE);
  const gstAmount = roundMoney((taxableAmount * gstPercentage) / 100);
  const totalAmount = roundMoney(taxableAmount + gstAmount);

  return {
    studentCount,
    ratePerStudent,
    baseAmount,
    referencePercentage,
    commissionAmount,
    taxableAmount,
    gstPercentage,
    gstAmount,
    totalAmount,
    paymentMode: school.payment_mode || "annual",
  };
}

function buildSchoolRow(school, studentCount) {
  const billing = buildBilling(school, studentCount);
  return {
    schoolId: school.id,
    schoolName: school.school_name,
    schoolCode: school.school_code,
    schoolStatus: school.status,
    city: school.city,
    state: school.state,
    email: school.email,
    referenceName: school.reference_name || "",
    referencePercentage: billing.referencePercentage,
    paymentMode: billing.paymentMode,
    billing,
  };
}

async function getStudentCountMap(schoolIds) {
  if (!schoolIds.length) return new Map();

  const rows = await Student.findAll({
    attributes: ["school_id", [fn("COUNT", col("id")), "student_count"]],
    where: {
      school_id: { [Op.in]: schoolIds },
      is_active: true,
    },
    group: ["school_id"],
    raw: true,
  });

  return new Map(rows.map((row) => [String(row.school_id), Number(row.student_count || 0)]));
}

export async function getBillingOverview({ search = "" } = {}) {
  const trimmedSearch = String(search || "").trim();
  const where = trimmedSearch
    ? {
        [Op.or]: [
          { school_name: { [Op.like]: `%${trimmedSearch}%` } },
          { school_code: { [Op.like]: `%${trimmedSearch}%` } },
          { city: { [Op.like]: `%${trimmedSearch}%` } },
          { state: { [Op.like]: `%${trimmedSearch}%` } },
          { email: { [Op.like]: `%${trimmedSearch}%` } },
          { reference_name: { [Op.like]: `%${trimmedSearch}%` } },
        ],
      }
    : {};

  const schools = await School.findAll({
    where,
    order: [["school_name", "ASC"]],
  });
  const studentCountMap = await getStudentCountMap(schools.map((school) => school.id));
  const rows = schools.map((school) => buildSchoolRow(school, studentCountMap.get(String(school.id)) || 0));

  const totals = rows.reduce(
    (sum, row) => ({
      schoolCount: sum.schoolCount + 1,
      studentCount: sum.studentCount + row.billing.studentCount,
      baseAmount: roundMoney(sum.baseAmount + row.billing.baseAmount),
      commissionAmount: roundMoney(sum.commissionAmount + row.billing.commissionAmount),
      taxableAmount: roundMoney(sum.taxableAmount + row.billing.taxableAmount),
      gstAmount: roundMoney(sum.gstAmount + row.billing.gstAmount),
      totalAmount: roundMoney(sum.totalAmount + row.billing.totalAmount),
    }),
    {
      schoolCount: 0,
      studentCount: 0,
      baseAmount: 0,
      commissionAmount: 0,
      taxableAmount: 0,
      gstAmount: 0,
      totalAmount: 0,
    }
  );

  return { rows, totals };
}

export async function getSchoolBillingSummary(schoolId) {
  const school = await School.findByPk(schoolId);
  if (!school) throw new AppError("School not found", 404);

  const studentCount = await Student.count({
    where: {
      school_id: school.id,
      is_active: true,
    },
  });

  return buildSchoolRow(school, studentCount);
}

export async function listBillingReferences() {
  return BillingReference.findAll({ order: [["name", "ASC"]] });
}

export async function createBillingReference(payload) {
  const name = String(payload?.name || "").trim();
  if (!name) throw new AppError("Reference name is required", 400);

  return BillingReference.create({
    name,
    contact_name: payload?.contact_name || null,
    email: payload?.email || null,
    phone: payload?.phone || null,
    commission_percentage: toNumber(payload?.commission_percentage),
    is_active: payload?.is_active !== false,
    notes: payload?.notes || null,
  });
}

export async function updateBillingReference(id, payload) {
  const reference = await BillingReference.findByPk(id);
  if (!reference) throw new AppError("Reference partner not found", 404);

  await reference.update({
    ...(payload?.name !== undefined ? { name: String(payload.name).trim() } : {}),
    ...(payload?.contact_name !== undefined ? { contact_name: payload.contact_name || null } : {}),
    ...(payload?.email !== undefined ? { email: payload.email || null } : {}),
    ...(payload?.phone !== undefined ? { phone: payload.phone || null } : {}),
    ...(payload?.commission_percentage !== undefined
      ? { commission_percentage: toNumber(payload.commission_percentage) }
      : {}),
    ...(payload?.is_active !== undefined ? { is_active: Boolean(payload.is_active) } : {}),
    ...(payload?.notes !== undefined ? { notes: payload.notes || null } : {}),
  });

  return reference;
}

export async function assignSchoolReference(schoolId, referenceId) {
  const [school, reference] = await Promise.all([
    School.findByPk(schoolId),
    BillingReference.findByPk(referenceId),
  ]);

  if (!school) throw new AppError("School not found", 404);
  if (!reference) throw new AppError("Reference partner not found", 404);

  await school.update({
    reference_name: reference.name,
    reference_percentage: reference.commission_percentage,
  });

  return getSchoolBillingSummary(school.id);
}

export async function clearSchoolReference(schoolId) {
  const school = await School.findByPk(schoolId);
  if (!school) throw new AppError("School not found", 404);

  await school.update({
    reference_name: null,
    reference_percentage: null,
  });

  return getSchoolBillingSummary(school.id);
}

export async function listBillingInvoices(schoolId) {
  const where = schoolId ? { school_id: schoolId } : {};
  const invoices = await BillingInvoice.findAll({
    where,
    order: [
      ["billing_month", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  return invoices.map(serializeInvoice);
}

export async function getBillingInvoice(id) {
  const invoice = await BillingInvoice.findByPk(id);
  if (!invoice) throw new AppError("Invoice not found", 404);
  return serializeInvoice(invoice);
}

export async function createBillingInvoice(payload) {
  const schoolId = Number(payload?.school_id || payload?.schoolId);
  if (!schoolId) throw new AppError("School is required", 400);

  const summary = await getSchoolBillingSummary(schoolId);
  const billingMonth = getBillingMonth(payload?.billing_month);
  const invoicePayload = {
    school_id: schoolId,
    invoice_no: invoiceNumber(schoolId, billingMonth),
    billing_month: billingMonth,
    period_start: payload?.period_start || null,
    period_end: payload?.period_end || null,
    student_count: summary.billing.studentCount,
    rate_per_student: summary.billing.ratePerStudent,
    base_amount: summary.billing.baseAmount,
    reference_name: summary.referenceName || null,
    reference_percentage: summary.billing.referencePercentage,
    commission_amount: summary.billing.commissionAmount,
    taxable_amount: summary.billing.taxableAmount,
    gst_percentage: summary.billing.gstPercentage,
    gst_amount: summary.billing.gstAmount,
    total_amount: summary.billing.totalAmount,
    status: "generated",
    generated_by: payload?.generated_by || null,
  };

  const [invoice] = await BillingInvoice.upsert(invoicePayload);
  if (invoice && typeof invoice.get === "function") return serializeInvoice(invoice);

  return serializeInvoice(await BillingInvoice.findOne({
    where: {
      school_id: schoolId,
      billing_month: billingMonth,
    },
  }));
}
