import api from "../../api/axios";

export const getTeacherPendingApprovals = () =>
    api.get("/teachers/approvals/pending");

export const approveRequest = (type, id, action = 'approve') =>
    api.post(`/teachers/approvals/${type}/${id}/${action}`);

export const approveParentRequest = (id, action = "approve") =>
    api.post(`/teachers/approvals/parent/${id}/${action}`);

export const getTeacherApprovalHistory = (params = {}) =>
    api.get("/teachers/approvals/history", { params });
