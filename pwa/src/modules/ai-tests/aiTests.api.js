import api from "../../api/axios";

export const createTeacherAssignedTest = (payload) =>
  api.post("/teacher/ai-tests", payload);

export const getTeacherAssignedTests = () => api.get("/teacher/ai-tests");

export const getTeacherAssignedTest = (id) => api.get(`/teacher/ai-tests/${id}`);

export const reviewTeacherAssignedSubmission = (assignmentId, submissionId, payload) =>
  api.patch(`/teacher/ai-tests/${assignmentId}/submissions/${submissionId}/review`, payload);

export const getStudentAssignedTests = () => api.get("/student/ai-tests");

export const getStudentAssignedTest = (id) => api.get(`/student/ai-tests/${id}`);

export const startStudentAssignedTest = (id) => api.post(`/student/ai-tests/${id}/start`);

export const submitStudentAssignedTest = (id, answers, options = {}) =>
  api.post(`/student/ai-tests/${id}/submit`, { answers, ...options });

export const getStudentTestLockStatus = () => api.get("/student/ai-tests/lock-status");

export const getParentAssignedTests = (params = {}) => api.get("/parent/ai-tests", { params });

