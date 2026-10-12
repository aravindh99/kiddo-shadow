import api from "../../api/axios";

export const getPersonalizedInsights = () =>
  api.get("/analytics/ai/student/insights");
