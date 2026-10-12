// src/modules/schooladmin/classes/class.js
import { api } from "../../../services/api";

/**
 * LIST CLASSES
 * GET /api/classes
 * Response: { total, items }
 */
export async function getClasses() {
  const res = await api.get("/api/classes");
  // Handle both { total, items } and { success, data: { items } } or direct array or { data: [...] }
  let items = [];
  if (Array.isArray(res)) items = res;
  else if (Array.isArray(res?.items)) items = res.items;
  else if (Array.isArray(res?.data)) items = res.data;
  else if (Array.isArray(res?.data?.items)) items = res.data.items;

  const total = res?.total || res?.data?.total || items.length;

  return { total, items };
}

/**
 * GET CLASS BY ID
 * GET /api/classes/:id
 */
export async function getClassById(id) {
  const res = await api.get(`/api/classes/${id}`);
  return res?.data || res;
}

/**
 * GET LOGIN ROSTER
 * GET /api/classes/login-roster
 * Query: class_id, section_id
 */
export async function getLoginRoster(params = {}) {
  const res = await api.get("/api/classes/login-roster", { params });
  return res?.data || res;
}

/**
 * CREATE CLASS
 * POST /api/classes
 * Body: { class_name }
 */
export async function createClass(payload) {
  const res = await api.post("/api/classes", payload);
  return res?.data || res;
}

/**
 * UPDATE CLASS
 * PATCH /api/classes/:id
 * Body: { class_name }
 */
export async function updateClass(id, payload) {
  const res = await api.patch(`/api/classes/${id}`, payload);
  return res?.data || res;
}

/**
 * DELETE CLASS
 * DELETE /api/classes/:id
 */
export async function deleteClass(id) {
  const res = await api.delete(`/api/classes/${id}`);
  return res;
}

/* ================= SECTIONS API (Merged) ================= */

/**
 * GET SECTIONS BY CLASS
 * GET /api/sections/classes/:classId/sections
 */
export async function getSectionsByClass(classId) {
  const res = await api.get(`/api/sections/classes/${classId}/sections`);
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

/**
 * CREATE SECTION
 * POST /api/sections
 * Body: { class_id, name }
 */
export async function createSection({ class_id, name }) {
  return api.post("/api/sections", {
    class_id: Number(class_id),
    name,
  });
}

/**
 * UPDATE SECTION STATUS
 * PATCH /api/sections/:id/status
 * Body: { is_active }
 */
export async function updateSectionStatus(id, is_active) {
  return api.patch(`/api/sections/${id}/status`, {
    is_active,
  });
}

/**
 * DELETE SECTION
 * DELETE /api/sections/:id
 */
export async function deleteSection(id) {
  return api.delete(`/api/sections/${id}`);
}

/**
 * FETCH CLASSES WITH SECTIONS (Consolidated)
 */
export async function getClassesWithSections() {
  try {
    const res = await getClasses();
    return {
      items: res.items || [],
      total: res.total || 0
    };
  } catch (e) {
    console.error("Fetch failed", e);
    throw e;
  }
}
