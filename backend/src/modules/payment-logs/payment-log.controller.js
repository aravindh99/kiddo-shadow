import asyncHandler from "../../shared/asyncHandler.js";
import {
  createPaymentLogsService,
  getParentPaymentLogsService,
  getPaymentLogDropdownOptionsService,
  getPaymentLogsService,
} from "./payment-log.service.js";

export const getPaymentLogs = asyncHandler(async (req, res) => {
  const data = await getPaymentLogsService({
    schoolId: req.user.school_id,
    classId: req.query.classId,
    sectionId: req.query.sectionId,
  });

  res.json({
    success: true,
    count: data.length,
    data,
  });
});

export const createPaymentLogs = asyncHandler(async (req, res) => {
  const data = await createPaymentLogsService({
    schoolId: req.user.school_id,
    senderUserId: req.user.id,
    senderRole: req.user.role,
    classId: req.body.classId,
    sectionId: req.body.sectionId,
    amount: req.body.amount,
    title: req.body.title,
    message: req.body.message,
    dueDate: req.body.dueDate ?? null,
  });

  res.status(201).json({
    success: true,
    ...data,
  });
});

export const getPaymentLogDropdownOptions = asyncHandler(async (req, res) => {
  const data = await getPaymentLogDropdownOptionsService({
    schoolId: req.user.school_id,
    classId: req.query.classId,
  });

  res.json({
    success: true,
    data,
  });
});

export const getParentPaymentLogs = asyncHandler(async (req, res) => {
  const data = await getParentPaymentLogsService({
    schoolId: req.user.school_id,
    parentUserId: req.user.id,
    studentId: req.query.student_id ? Number(req.query.student_id) : null,
  });

  res.json({
    success: true,
    data,
  });
});
