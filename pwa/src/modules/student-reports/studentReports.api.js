import api from "../../api/axios";

export const getTeacherAssignments = async () => {
  const response = await api.get("/teacher-assignments/teacher/me");
  return response?.data?.data ?? response?.data?.items ?? response?.data ?? [];
};

export const getTeacherSectionStudents = async (params = {}) => {
  const response = await api.get("/students/teacher/section", { params });
  return response?.data?.items ?? response?.data?.data ?? response?.data ?? [];
};

export const getTeacherAttendanceSummary = async (params = {}) => {
  const response = await api.get("/teachers/attendance/summary", { params });
  return response?.data?.items ?? response?.data?.data ?? response?.data ?? [];
};
export const getTeacherStudentReports = async () => {
  const response = await api.get("/teachers/students-reports");
  return response?.data ?? {};
};
