import { api } from "@/services/api";

/**
 * APPROVALS API SERVICE
 * Supports both Teacher and Admin roles with distinct route structures.
 */

/* ==========================================================================
   TEACHER ROLE (Scoped to assigned sections)
   ========================================================================== */

/**
 * GET /api/teachers/approvals/pending
 * @param {Object} params - limit, offset, class_id, from_date, to_date
 */
export const getPendingStudentApprovals = async (params = {}) => {
  try {
    const res = await api.get("/api/teachers/approvals/pending", { params });
    // Expected Response: { "total": number, "items": [students] }
    return res?.items || [];
  } catch (err) {
    console.warn("Teacher Approvals Fetch Error:", err);
    return [];
  }
};

/**
 * POST /api/teachers/approvals/:type/:id/:action
 * @param {string} type - student | teacher | parent
 * @param {string} id - target item ID
 * @param {string} action - approve | reject
 * @param {string} rejectionReason - Optional reason
 */
export const processTeacherApproval = async (type, id, action, rejectionReason = "") => {
  const payload = {};
  if (action === "reject" && rejectionReason) {
    payload.rejection_reason = rejectionReason;
  }
  return api.post(`/api/teachers/approvals/${type}/${id}/${action}`, payload);
};

/* ==========================================================================
   ADMIN ROLE (School Admin)
   ========================================================================== */

/**
 * GET /api/admin/approvals/pending
 * @param {Object} params - limit, offset, from_date, to_date
 */
export const getPendingAdminApprovals = async (params = {}) => {
  try {
    const res = await api.get("/api/admin/approvals/pending", { params });
    // Expected Response: { "teachers": { total, items }, "parents": { total, items } }
    return {
      teachers: res?.teachers?.items || [],
      parents: res?.parents?.items || [],
    };
  } catch (err) {
    console.warn("Admin Approvals Fetch Error:", err);
    return { teachers: [], parents: [] };
  }
};

/**
 * POST /api/admin/approvals/:type/:id/:action
 * @param {string} type - student | teacher | parent
 * @param {string} id - target item ID
 * @param {string} action - approve | reject
 * @param {string} rejectionReason - Optional reason
 */
export const processAdminApproval = async (type, id, action, rejectionReason = "") => {
  const payload = {};
  if (action === "reject" && rejectionReason) {
    payload.rejection_reason = rejectionReason;
  }
  return api.post(`/api/admin/approvals/${type}/${id}/${action}`, payload);
};
