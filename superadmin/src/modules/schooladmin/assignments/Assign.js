import { api } from "@/services/api";

/**
 * Assign.js Service
 * High-performance service for managing teacher assignments.
 */

// 1. Assign Teacher (Create)
export async function assignTeacher(payload) {
  const res = await api.post("/api/teacher-assignments", payload);
  return res?.data || res;
}

// 2. List All Assignments
export async function listAssignments() {
  const res = await api.get("/api/teacher-assignments");
  const response = res?.data || res;

  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;

  return [];
}

// 3. Get Section Assignments
export async function getSectionAssignments(sectionId) {
  const res = await api.get(`/api/teacher-assignments/section/${sectionId}`);
  const response = res?.data || res;
  return response?.data || (Array.isArray(response) ? response : []);
}

// 4. Update Assignment
export async function updateAssignment(id, payload) {
  const res = await api.patch(`/api/teacher-assignments/${id}`, payload);
  return res?.data || res;
}

// 5. Delete Assignment
export async function deleteAssignment(id) {
  const res = await api.delete(`/api/teacher-assignments/${id}`);
  return res?.data || res;
}

