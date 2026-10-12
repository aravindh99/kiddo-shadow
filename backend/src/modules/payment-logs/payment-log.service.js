import db from "../../config/db.js";
import AppError from "../../shared/appError.js";

import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import School from "../schools/school.model.js";
import { createNotificationService } from "../notifications/notification.service.js";
import { listApprovedParentLinks } from "../parents/parent.family.service.js";

import { QueryTypes } from "sequelize";

const CLASS_FEE_COLUMN_CANDIDATES = [
  "default_fee_amount",
  "fee_amount",
  "default_amount",
  "monthly_fee",
  "amount",
];

const PAYMENT_TABLE_CANDIDATES = [
  "paymentlogs",
  "payments",
  "payment_logs",
  "student_payments",
  "fee_payments",
];

const PAYMENT_STUDENT_COLUMN_CANDIDATES = ["student_id", "studentId"];
const PAYMENT_AMOUNT_COLUMN_CANDIDATES = [
  "paid_amount",
  "payment_amount",
  "amount",
  "paid",
];
const PAYMENT_STATUS_COLUMN_CANDIDATES = ["payment_status", "status"];
const PAYMENT_DATE_COLUMN_CANDIDATES = [
  "payment_date",
  "paid_date",
  "paid_at",
  "created_at",
  "date",
];
const PAYMENT_TITLE_COLUMN_CANDIDATES = ["title", "fee_title", "name"];
const PAYMENT_MESSAGE_COLUMN_CANDIDATES = ["message", "description", "remarks"];
const PAYMENT_DUE_DATE_COLUMN_CANDIDATES = ["due_date", "deadline_date"];
const SCHOOL_UPI_COLUMN_CANDIDATES = [
  "upi_id",
  "upi_vpa",
  "payment_upi_id",
  "merchant_upi_id",
  "school_upi_id",
  "gpay_upi_id",
  "paytm_upi_id",
  "phonepe_upi_id",
];
const CLASS_DROPDOWN_ORDER = [
  "prekg",
  "lkg",
  "ukg",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];
const CLASS_DROPDOWN_LABELS = {
  prekg: "PreKG",
  lkg: "LKG",
  ukg: "UKG",
};

const toCanonicalClassLevel = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? String(value) : null;
  }

  let text = String(value).trim().toLowerCase();
  if (!text) return null;
  text = text.replace(/[_-]/g, "");
  text = text.replace(/\s+/g, "");

  if (text === "everyone") return "everyone";

  if (text === "prekg" || text === "prek" || text === "prekindergarten") return "prekg";
  if (text === "lkg" || text === "lowerkg" || text === "lowerkindergarten") return "lkg";
  if (text === "ukg" || text === "upperkg" || text === "upperkindergarten") return "ukg";

  text = text.replace(/^class/, "").replace(/^grade/, "");
  if (/^\d+$/.test(text)) return String(Number(text));

  return null;
};

const toCanonicalClassNameFromDb = (className) => {
  if (!className) return null;
  return toCanonicalClassLevel(className);
};

const toClassDropdownLabel = (value) => {
  if (CLASS_DROPDOWN_LABELS[value]) return CLASS_DROPDOWN_LABELS[value];
  return `Class ${value}`;
};

const resolveClassScope = async ({ schoolId, classScope }) => {
  if (typeof classScope === "number") {
    const byId = await Class.findOne({
      where: { id: classScope, school_id: schoolId },
      attributes: ["id", "class_name"],
    });
    if (!byId) {
      throw new AppError("Class not found", 404);
    }
    return {
      isEveryone: false,
      numericClassId: Number(byId.id),
      classInfo: byId,
    };
  }

  const canonical = toCanonicalClassLevel(classScope);
  if (!canonical) {
    throw new AppError("Valid classId is required", 400);
  }

  if (canonical === "everyone") {
    return { isEveryone: true, numericClassId: null, classInfo: null };
  }

  const classes = await Class.findAll({
    where: { school_id: schoolId },
    attributes: ["id", "class_name"],
  });

  const byName = classes.find(
    (item) => toCanonicalClassNameFromDb(item.class_name) === canonical
  );

  if (!byName) {
    throw new AppError("Class not found", 404);
  }

  return {
    isEveryone: false,
    numericClassId: Number(byName.id),
    classInfo: byName,
  };
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const pickFirstExisting = (cols, candidates) => {
  for (const c of candidates) {
    if (cols.has(c)) return c;
  }
  return null;
};

const getTableColumns = async (tableName) => {
  const rows = await db.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = :tableName
    `,
    {
      replacements: { tableName },
      type: QueryTypes.SELECT,
    }
  );

  return new Set(rows.map((r) => r.column_name));
};

const detectPaymentTable = async () => {
  const rows = await db.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `,
    { type: QueryTypes.SELECT }
  );

  const tableNames = new Set(rows.map((r) => r.table_name));

  for (const name of PAYMENT_TABLE_CANDIDATES) {
    if (tableNames.has(name)) return name;
  }

  const discovered = rows
    .map((r) => r.table_name)
    .find((t) => t.includes("payment"));

  return discovered || null;
};

const getPaymentTableMeta = async () => {
  const paymentTable = await detectPaymentTable();
  if (!paymentTable) {
    throw new AppError("Payment table not found in database", 404);
  }

  const cols = await getTableColumns(paymentTable);

  const studentCol = pickFirstExisting(cols, PAYMENT_STUDENT_COLUMN_CANDIDATES);
  if (!studentCol) {
    throw new AppError("Payment table missing student column", 500);
  }

  const amountCol = pickFirstExisting(cols, PAYMENT_AMOUNT_COLUMN_CANDIDATES);
  const statusCol = pickFirstExisting(cols, PAYMENT_STATUS_COLUMN_CANDIDATES);
  const dateCol = pickFirstExisting(cols, PAYMENT_DATE_COLUMN_CANDIDATES);
  const titleCol = pickFirstExisting(cols, PAYMENT_TITLE_COLUMN_CANDIDATES);
  const messageCol = pickFirstExisting(cols, PAYMENT_MESSAGE_COLUMN_CANDIDATES);
  const dueDateCol = pickFirstExisting(cols, PAYMENT_DUE_DATE_COLUMN_CANDIDATES);

  return {
    paymentTable,
    cols,
    studentCol,
    amountCol,
    statusCol,
    dateCol,
    titleCol,
    messageCol,
    dueDateCol,
  };
};

const getDefaultClassAmount = async ({ schoolId, classId }) => {
  const classColumns = await getTableColumns("classes");
  const feeColumn = pickFirstExisting(classColumns, CLASS_FEE_COLUMN_CANDIDATES);

  if (!feeColumn) return 0;

  const rows = await db.query(
    `
      SELECT "${feeColumn}" AS default_amount
      FROM classes
      WHERE id = :classId
        AND school_id = :schoolId
      LIMIT 1
    `,
    {
      replacements: { schoolId, classId },
      type: QueryTypes.SELECT,
    }
  );

  return toNumber(rows?.[0]?.default_amount);
};

const getSchoolPaymentProfile = async ({ schoolId }) => {
  const schoolColumns = await getTableColumns("schools");
  const upiColumn = pickFirstExisting(schoolColumns, SCHOOL_UPI_COLUMN_CANDIDATES);

  const selectedColumns = [
    `"id"`,
    `"school_name"`,
    `"payment_mode"`,
    `"contact_phone"`,
    `"email"`,
  ];

  if (upiColumn) {
    selectedColumns.push(`"${upiColumn}" AS upi_id`);
  }

  const rows = await db.query(
    `
      SELECT ${selectedColumns.join(", ")}
      FROM schools
      WHERE id = :schoolId
      LIMIT 1
    `,
    {
      replacements: { schoolId },
      type: QueryTypes.SELECT,
    }
  );

  return rows?.[0] || null;
};

const getLatestPaymentsByStudent = async ({
  schoolId,
  classId = null,
  sectionId = null,
  studentIds,
}) => {
  if (!studentIds.length) return new Map();

  const { paymentTable, cols, studentCol, amountCol, statusCol, dateCol } =
    await getPaymentTableMeta();

  const hasSchoolCol = cols.has("school_id");
  const hasClassCol = cols.has("class_id");
  const hasSectionCol = cols.has("section_id");

  const whereParts = [`"${studentCol}" IN (:studentIds)`];
  if (hasSchoolCol) whereParts.push(`"school_id" = :schoolId`);
  if (hasClassCol && classId) whereParts.push(`"class_id" = :classId`);
  if (hasSectionCol && sectionId) whereParts.push(`"section_id" = :sectionId`);

  const rows = await db.query(
    `
      SELECT *
      FROM "${paymentTable}"
      WHERE ${whereParts.join(" AND ")}
    `,
    {
      replacements: { schoolId, classId, sectionId, studentIds },
      type: QueryTypes.SELECT,
    }
  );

  const latestMap = new Map();

  for (const row of rows) {
    const sid = Number(row[studentCol]);
    if (!Number.isFinite(sid)) continue;

    const prev = latestMap.get(sid);
    if (!prev) {
      latestMap.set(sid, row);
      continue;
    }

    const currentTime = dateCol && row[dateCol] ? new Date(row[dateCol]).getTime() : 0;
    const prevTime = dateCol && prev[dateCol] ? new Date(prev[dateCol]).getTime() : 0;

    if (currentTime > prevTime) {
      latestMap.set(sid, row);
      continue;
    }

    if (currentTime === prevTime && Number(row.id || 0) > Number(prev.id || 0)) {
      latestMap.set(sid, row);
    }
  }

  const normalizedMap = new Map();
  for (const [sid, row] of latestMap.entries()) {
    const paidAmount = amountCol ? toNumber(row[amountCol]) : 0;
    const rawStatus = statusCol ? String(row[statusCol] ?? "").toLowerCase() : "";
    const isPaidByStatus = ["paid", "success", "completed"].includes(rawStatus);
    const paymentStatus = paidAmount > 0 || isPaidByStatus ? "Paid" : "Not Paid";

    normalizedMap.set(sid, {
      paidAmount,
      paymentStatus,
      paymentDate: dateCol ? row[dateCol] ?? null : null,
      title: titleCol ? row[titleCol] ?? null : null,
      message: messageCol ? row[messageCol] ?? null : null,
      dueDate: dueDateCol ? row[dueDateCol] ?? null : null,
    });
  }

  return normalizedMap;
};

const createOnePaymentRow = async ({
  transaction,
  schoolId,
  classId,
  sectionId,
  studentId,
  amount,
  title,
  message,
  dueDate,
  tableMeta,
}) => {
  const { paymentTable, cols, studentCol, amountCol, statusCol, dateCol, titleCol, messageCol, dueDateCol } =
    tableMeta;

  const insertColumns = [];
  const insertValues = [];
  const replacements = {};

  const pushCol = (col, value) => {
    insertColumns.push(`"${col}"`);
    const key = `v_${insertColumns.length}`;
    insertValues.push(`:${key}`);
    replacements[key] = value;
  };

  pushCol(studentCol, studentId);
  if (cols.has("school_id")) pushCol("school_id", schoolId);
  if (cols.has("class_id")) pushCol("class_id", classId);
  if (cols.has("section_id")) pushCol("section_id", sectionId);
  if (amountCol) pushCol(amountCol, 0);
  if (statusCol) pushCol(statusCol, "not_paid");
  if (dateCol) pushCol(dateCol, null);
  if (titleCol) pushCol(titleCol, title);
  if (messageCol) pushCol(messageCol, message);
  if (dueDateCol && dueDate) pushCol(dueDateCol, dueDate);
  if (cols.has("default_amount")) pushCol("default_amount", amount);
  if (cols.has("demand_amount")) pushCol("demand_amount", amount);
  if (cols.has("amount_due")) pushCol("amount_due", amount);
  if (cols.has("created_at")) pushCol("created_at", new Date());
  if (cols.has("updated_at")) pushCol("updated_at", new Date());

  await db.query(
    `
      INSERT INTO "${paymentTable}" (${insertColumns.join(", ")})
      VALUES (${insertValues.join(", ")})
    `,
    {
      replacements,
      type: QueryTypes.INSERT,
      transaction,
    }
  );
};

export const createPaymentLogsService = async ({
  schoolId,
  senderUserId,
  senderRole,
  classId,
  sectionId,
  amount,
  title,
  message,
  dueDate,
}) => {
  if (!schoolId) {
    throw new AppError("School context is required", 400);
  }

  const { isEveryone, numericClassId, classInfo } = await resolveClassScope({
    schoolId,
    classScope: classId,
  });

  if (isEveryone && sectionId) {
    throw new AppError("sectionId is not allowed when classId is 'everyone'", 400);
  }
  if (sectionId && !numericClassId) {
    throw new AppError("sectionId requires a valid classId", 400);
  }

  const sectionInfo = await (sectionId
      ? Section.findOne({
          where: { id: sectionId, class_id: numericClassId, school_id: schoolId },
          attributes: ["id", "name"],
        })
      : Promise.resolve(null));

  if (sectionId && !sectionInfo) throw new AppError("Section not found for selected class", 404);

  const studentWhere = { school_id: schoolId };
  if (numericClassId) studentWhere.class_id = numericClassId;
  if (sectionId) studentWhere.section_id = sectionId;

  const students = await Student.findAll({
    where: studentWhere,
    attributes: ["id", "class_id", "section_id"],
    order: [["id", "ASC"]],
  });

  if (!students.length) {
    throw new AppError("No students found for selected scope", 404);
  }

  const tableMeta = await getPaymentTableMeta();

  const tx = await db.transaction();
  try {
    for (const student of students) {
      await createOnePaymentRow({
        transaction: tx,
        schoolId,
        classId: Number(student.class_id),
        sectionId: student.section_id ? Number(student.section_id) : null,
        studentId: Number(student.id),
        amount,
        title,
        message,
        dueDate,
        tableMeta,
      });
    }

    await createNotificationService({
      school_id: schoolId,
      sender_user_id: senderUserId,
      sender_role: senderRole,
      title,
      message: `${message ? `${message} ` : ""}(Amount: ${amount})`,
      target_role: "parent",
      class_id: numericClassId ?? null,
      section_id: sectionId ?? null,
    });

    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }

  return {
    message: "Payment logs created and parent notification sent",
    class: isEveryone ? "Everyone" : classInfo.class_name,
    section: sectionInfo?.name ?? (isEveryone ? "All Classes & Sections" : "All Sections"),
    studentCount: students.length,
    amount,
    title,
    dueDate,
  };
};

export const getPaymentLogsService = async ({ schoolId, classId, sectionId }) => {
  if (!schoolId) {
    throw new AppError("School context is required", 400);
  }

  const resolvedClassScope = classId ?? "everyone";
  const { isEveryone, numericClassId, classInfo } = await resolveClassScope({
    schoolId,
    classScope: resolvedClassScope,
  });

  if (isEveryone && sectionId) {
    throw new AppError("sectionId requires a valid classId", 400);
  }

  const sectionInfo = await (sectionId
      ? Section.findOne({
          where: { id: sectionId, class_id: numericClassId, school_id: schoolId },
          attributes: ["id", "name"],
        })
      : Promise.resolve(null));

  if (sectionId && !sectionInfo) throw new AppError("Section not found for selected class", 404);

  const studentWhere = { school_id: schoolId };
  if (numericClassId) studentWhere.class_id = numericClassId;
  if (sectionId) studentWhere.section_id = sectionId;

  const [students, defaultAmount] = await Promise.all([
    Student.findAll({
      where: studentWhere,
      attributes: ["id", "class_id", "section_id"],
      include: [
        {
          model: Class,
          attributes: ["class_name"],
        },
        {
          model: Section,
          attributes: ["name"],
        },
        {
          model: User,
          attributes: ["name"],
        },
        {
          model: Parent,
          required: false,
          attributes: ["id"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    }),
    numericClassId ? getDefaultClassAmount({ schoolId, classId: numericClassId }) : Promise.resolve(0),
  ]);

  const studentIds = students.map((s) => Number(s.id));
  const paymentByStudent = await getLatestPaymentsByStudent({
    schoolId,
    classId: numericClassId,
    sectionId,
    studentIds,
  });

  return students.map((student) => {
    const payment = paymentByStudent.get(Number(student.id));
    const parent = Array.isArray(student.parents) ? student.parents[0] : null;

    return {
      studentName: (student.user ?? student.User)?.name ?? null,
      parentName: (parent?.user ?? parent?.User)?.name ?? null,
      class: classInfo?.class_name ?? student.class?.class_name ?? "Unknown",
      section: sectionInfo?.name ?? student.section?.name ?? "Unknown",
      defaultAmount,
      paidAmount: payment?.paidAmount ?? 0,
      paymentStatus: payment?.paymentStatus ?? "Not Paid",
      paymentDate: payment?.paymentDate ?? null,
    };
  });
};

export const getPaymentLogDropdownOptionsService = async ({ schoolId, classId }) => {
  if (!schoolId) {
    throw new AppError("School context is required", 400);
  }

  const classes = await Class.findAll({
    where: { school_id: schoolId },
    attributes: ["id", "class_name"],
    order: [["class_name", "ASC"]],
  });

  const canonicalToClass = new Map();
  for (const dbClass of classes) {
    const canonical = toCanonicalClassNameFromDb(dbClass.class_name);
    if (!canonical) continue;
    if (!CLASS_DROPDOWN_ORDER.includes(canonical)) continue;
    if (!canonicalToClass.has(canonical)) {
      canonicalToClass.set(canonical, dbClass);
    }
  }

  const classOptions = [{ value: "everyone", label: "Everyone", classId: null }];
  for (const key of CLASS_DROPDOWN_ORDER) {
    const linkedClass = canonicalToClass.get(key) ?? null;
    classOptions.push({
      value: key,
      label: toClassDropdownLabel(key),
      classId: linkedClass ? Number(linkedClass.id) : null,
    });
  }

  let sectionOptions = [];
  if (classId && classId !== "everyone") {
    const { numericClassId } = await resolveClassScope({
      schoolId,
      classScope: classId,
    });

    sectionOptions = (
      await Section.findAll({
        where: { school_id: schoolId, class_id: numericClassId },
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
      })
    ).map((s) => ({
      id: Number(s.id),
      name: s.name,
    }));
  }

  return {
    sectionOptional: true,
    classOptions,
    sectionOptions,
  };
};

export const getParentPaymentLogsService = async ({ schoolId, parentUserId, studentId = null }) => {
  if (!schoolId) {
    throw new AppError("School context is required", 400);
  }

  const parentLinks = await listApprovedParentLinks({
    parent_user_id: parentUserId,
    school_id: schoolId,
    includeStudentDetails: true,
  });

  const seenStudentIds = new Set();
  const students = parentLinks
    .map((link) => link.student ?? link.Student)
    .filter((student) => {
      if (!student) return false;
      if (!studentId) return true;
      return Number(student.id) === Number(studentId);
    })
    .filter((student) => {
      const id = Number(student.id);
      if (!Number.isFinite(id) || seenStudentIds.has(id)) return false;
      seenStudentIds.add(id);
      return true;
    });

  const studentIds = [...new Set(students.map((s) => Number(s.id)).filter(Number.isFinite))];
  const paymentByStudent = await getLatestPaymentsByStudent({
    schoolId,
    studentIds,
  });

  const classIds = [...new Set(students.map((s) => Number(s.class_id)).filter(Number.isFinite))];
  const classAmountMap = new Map();
  await Promise.all(
    classIds.map(async (classId) => {
      const amount = await getDefaultClassAmount({ schoolId, classId });
      classAmountMap.set(classId, amount);
    })
  );

  const items = students.map((student) => {
    const defaultAmount = classAmountMap.get(Number(student.class_id)) ?? 0;
    const payment = paymentByStudent.get(Number(student.id));
    const paidAmount = payment?.paidAmount ?? 0;
    const balance = Math.max(defaultAmount - paidAmount, 0);

    return {
      studentId: Number(student.id),
      studentName: (student.user ?? student.User)?.name ?? null,
      class: (student.class ?? student.Class)?.class_name ?? "Unknown",
      section: (student.section ?? student.Section)?.name ?? "Unknown",
      defaultAmount,
      paidAmount,
      balance,
      paymentStatus: payment?.paymentStatus ?? (balance <= 0 ? "Paid" : "Not Paid"),
      paymentDate: payment?.paymentDate ?? null,
      title: payment?.title ?? null,
      message: payment?.message ?? null,
      dueDate: payment?.dueDate ?? null,
    };
  });

  const totals = items.reduce(
    (acc, item) => {
      acc.totalDue += item.defaultAmount;
      acc.totalPaid += item.paidAmount;
      acc.totalBalance += item.balance;
      return acc;
    },
    { totalDue: 0, totalPaid: 0, totalBalance: 0 }
  );

  const school = await getSchoolPaymentProfile({ schoolId });

  return {
    school: school
        ? {
            id: school.id,
            school_name: school.school_name,
            payment_mode: school.payment_mode,
            contact_phone: school.contact_phone || null,
            email: school.email || null,
            upi_id: school.upi_id || null,
          }
      : null,
    totals: {
      ...totals,
      studentCount: items.length,
    },
    items,
  };
};
