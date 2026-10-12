import api from "../../api/axios";

export const getTimetable = (params = {}) =>
  api.get("/timetables/section", { params });
