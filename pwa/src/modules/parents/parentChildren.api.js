import api from "../../api/axios";

export const getParentChildren = (params = {}) =>
  api.get("/parents/children", { params });
