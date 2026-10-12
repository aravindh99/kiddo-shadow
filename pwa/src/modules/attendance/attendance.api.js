import api from "../../api/axios";

export const getTeacherAttendanceSummary = (params = {}) =>
  api.get("/teachers/attendance/summary", { params });

export const getParentAttendanceSummary = (params = {}) =>
  api.get("/parents/attendance/summary", { params });

export const getStudentAttendanceSummary = (params = {}) =>
  api.get("/students/attendance/summary", { params });

export const markAttendance = (data) =>
  api.post("/teachers/attendance", data);

export const getTeacherAttendanceAnalytics = (params = {}) =>
  api.get("/teachers/attendance/analytics", { params });

export const getParentAttendanceAnalytics = (params = {}) =>
  api.get("/parents/attendance/analytics", { params });
