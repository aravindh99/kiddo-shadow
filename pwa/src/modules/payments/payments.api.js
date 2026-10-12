import api from "../../api/axios";

export const getMyPaymentLogs = (params = {}) => api.get("/payment-logs/me", { params });
