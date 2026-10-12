import { api } from "@/services/api";

/* =========================
   LIST PARENTS
   GET /api/parents/parents
========================= */
export async function getParents() {
  const res = await api.get("/api/parents/parents");

  // Handle direct array response or object with items
  if (Array.isArray(res)) {
    return { items: res, total: res.length };
  }
  return {
    total: res?.total || 0,
    items: Array.isArray(res?.items) ? res.items : [],
  };
}

/* =========================
   GET PARENT OPTIONS
   GET /api/parents/parents/options
========================= */
export async function getParentOptions() {
  // Returns list of parents for dropdowns
  const res = await api.get("/api/parents/parents/options");
  return Array.isArray(res) ? res : res?.items || [];
}

/* =========================
   CREATE PARENT (AND LINK)
   POST /api/parents/parents
========================= */
export async function createParent(payload) {
  /**
   * payload example:
   * { "student_id": 1, "relation_type": "guardian" }
   */
  const res = await api.post("/api/parents/parents", payload);
  return res;
}

/* =========================
   LINK EXISTING PARENT
   POST /api/parents/parents/link
========================= */
export async function linkParent(payload) {
  /**
   * payload:
   * { "parent_user_id": 1, "student_id": 1, "relation_type": "guardian" }
   */
  const res = await api.post("/api/parents/parents/link", payload);
  return res;
}

/* =========================
   UPDATE PARENT
   PATCH /api/parents/parents/:id
========================= */
export async function updateParent(id, payload) {
  const res = await api.patch(`/api/parents/parents/${id}`, payload);
  return res;
}

/* =========================
   DELETE PARENT
   DELETE /api/parents/parents/:id
========================= */
export async function deleteParent(id) {
  await api.delete(`/api/parents/parents/${id}`);
}
