import asyncHandler from "../../shared/asyncHandler.js";
import {
  createAssignedTest,
  getStudentAssignmentDetail,
  getStudentLockStatus,
  getTeacherAssignmentDetail,
  listParentAssignmentResults,
  listStudentAssignments,
  listTeacherAssignments,
  reviewStudentSubmission,
  startStudentAssignment,
  submitStudentAssignment,
} from "./ai-test-assignment.service.js";

export const createTeacherAssignedTest = asyncHandler(async (req, res) => {
  const data = await createAssignedTest({ user: req.user, payload: req.body });
  res.status(201).json({ success: true, data });
});

export const listTeacherAssignedTests = asyncHandler(async (req, res) => {
  const items = await listTeacherAssignments({ user: req.user });
  res.json({ success: true, items });
});

export const getTeacherAssignedTest = asyncHandler(async (req, res) => {
  const data = await getTeacherAssignmentDetail({
    user: req.user,
    assignmentId: Number(req.params.id),
  });
  res.json({ success: true, data });
});

export const reviewAssignedTestSubmission = asyncHandler(async (req, res) => {
  const data = await reviewStudentSubmission({
    user: req.user,
    assignmentId: Number(req.params.id),
    submissionId: Number(req.params.submissionId),
    payload: req.body,
  });
  res.json({ success: true, data });
});

export const listStudentAssignedTests = asyncHandler(async (req, res) => {
  const items = await listStudentAssignments({ user: req.user });
  res.json({ success: true, items });
});

export const getStudentAssignedTest = asyncHandler(async (req, res) => {
  const data = await getStudentAssignmentDetail({
    user: req.user,
    assignmentId: Number(req.params.id),
  });
  res.json({ success: true, data });
});

export const startAssignedTest = asyncHandler(async (req, res) => {
  const data = await startStudentAssignment({
    user: req.user,
    assignmentId: Number(req.params.id),
  });
  res.json({ success: true, data });
});

export const submitAssignedTest = asyncHandler(async (req, res) => {
  const data = await submitStudentAssignment({
    user: req.user,
    assignmentId: Number(req.params.id),
    answers: req.body?.answers,
    autoSubmit: Boolean(req.body?.auto_submit),
  });
  res.json({ success: true, data });
});

export const getAssignedTestLockStatus = asyncHandler(async (req, res) => {
  const data = await getStudentLockStatus({ user: req.user });
  res.json({ success: true, data });
});

export const listParentAssignedTests = asyncHandler(async (req, res) => {
  const items = await listParentAssignmentResults({
    user: req.user,
    student_id: req.query.student_id ? Number(req.query.student_id) : null,
  });
  res.json({ success: true, items });
});

