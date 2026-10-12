import api from "../../api/axios";

export const getReportCard = (id) => {
  return api.get(`/report-cards/${id}`);
};

export const listMyReportCards = () => {
  return api.get("/report-cards/student/list");
};
