import { api } from "@/services/api";

/**
 * Teachers Service Module
 * Handles all teacher-related administrative API calls.
 */

// 1. Fetch Teachers List
export async function getTeachers() {
  const res = await api.get("/api/teachers");
  const response = res?.data || res;

  if (Array.isArray(response)) {
    return { items: response, total: response.length };
  }
  if (Array.isArray(response?.items)) {
    return {
      items: response.items,
      total: response.total ?? response.items.length,
    };
  }
  if (Array.isArray(response?.data)) {
    return {
      items: response.data,
      total: response.total ?? response.data.length,
    };
  }
  return { items: [], total: 0 };
}

// 2. Fetch Teacher Options (Dropdowns)
export async function getTeacherOptions() {
  const res = await api.get("/api/teachers/options");
  return res?.data || [];
}

// 3. Provision New Teacher
export async function createTeacher(payload) {
  const res = await api.post("/api/teachers", payload);
  return res?.data || res;
}

// 4. Update Teacher Status
export async function updateTeacherStatus(id, isActive) {
  const res = await api.patch(`/teachers/${id}/status`, {
    is_active: isActive,
  });
  return res?.data || res;
}

// 5. Delete Teacher
export async function deleteTeacher(id) {
  const res = await api.delete(`/api/teachers/${id}`);
  return res?.data || res;
}
