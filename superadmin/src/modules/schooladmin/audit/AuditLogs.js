import { api } from "@/services/api";

/**
 * GET AUDIT LOGS
 * Backend: GET /api/audit-logs
 */
export const getAuditLogs = async (params = {}) => {
  const {
    entity_type,
    entity_id,
    from_date,
    to_date,
    limit = 10,
    offset = 0
  } = params;

  // Clean params: Remove empty strings, nulls, or undefined values
  const queryParams = {};
  if (entity_type) queryParams.entity_type = entity_type;
  if (entity_id) queryParams.entity_id = entity_id;
  if (from_date) queryParams.from_date = from_date;
  if (to_date) queryParams.to_date = to_date;
  queryParams.limit = limit;
  queryParams.offset = offset;

  // ⚡ PERFORMANCE FIX: Circuit Breaker for broken backend endpoint
  // "school_admin" role causes 500 error due to missing associations.
  const role = localStorage.getItem("role");
  if (role === 'school_admin' || role === 'schooladmin') {
    console.warn("Skipping Audit Logs API for school_admin (Backend Constraint).");
    return { total: 0, items: [] };
  }

  /* 
   * MATCHES BACKEND ROUTE:
   * router.get("/admin/audit-logs", ... listAuditLogs)
   */
  const res = await api.get("/api/admin/audit-logs", {
    params: queryParams,
  });

  // Robustly extract items and total, similar to Dashboard.js logic
  const items = Array.isArray(res?.items) ? res.items :
    (Array.isArray(res?.data?.items) ? res.data.items : []);

  const total = res?.total !== undefined ? res.total :
    (res?.data?.total !== undefined ? res.data.total : 0);

  return {
    total,
    items,
  };
};

/**
 * GET AUDIT LOG BY ID
 * Backend: GET /api/admin/audit-logs/:id
 */
export const getAuditLogById = async (id) => {
  const res = await api.get(`/api/admin/audit-logs/${id}`);
  return res?.data || res;
};
