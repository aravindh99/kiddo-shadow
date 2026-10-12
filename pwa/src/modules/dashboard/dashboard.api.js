import api from "../../api/axios";

export const getStudentDashboard = () => api.get("/students/dashboard");
export const getParentDashboard = () =>
  api.get("/parents/dashboard");
export const getTeacherDashboard = () => api.get("/teachers/dashboard");

// Backward-compatible helpers used by components
const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

export const fetchStudentDashboard = async () => unwrap(await getStudentDashboard());
export const fetchParentDashboard = async (params = {}) => {
  const res = await api.get("/parents/dashboard", { params });
  return res?.data ?? res;
};
export const fetchTeacherDashboard = async () => unwrap(await getTeacherDashboard());
