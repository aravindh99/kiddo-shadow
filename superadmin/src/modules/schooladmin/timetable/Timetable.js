import { api } from "@/services/api";

/**
 * TIMETABLE API SERVICE
 * Website: School Admin Only
 */

/* ==========================================================================
   CREATE TIMETABLE
   POST /api/timetables
   ========================================================================== */
export const createTimetable = async (payload) => {
  try {
    const res = await api.post("/api/timetables", payload);
    return res.data;
  } catch (error) {
    console.error("Create Timetable Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};

// 2. Get Section Timetable
export const getTimetableBySection = async (class_id, section_id) => {
  try {
    const res = await api.get("/api/timetables/section", {
      params: { class_id, section_id },
    });

    const response = res?.data || res;
    return response?.data || response || {};
  } catch (error) {
    console.error("Fetch Section Timetable Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};

// 3. Get Section Assignments
export const getSectionAssignments = async (section_id) => {
  try {
    const res = await api.get(`/api/teacher-assignments/section/${section_id}`);
    const response = res?.data || res;
    return response?.data || (Array.isArray(response) ? response : []);
  } catch (error) {
    console.error("Fetch Section Assignments Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};

// 4. Get My Timetable (Teacher)
export const getMyTimetable = async () => {
  try {
    const res = await api.get("/api/timetables/teacher/me");
    const response = res?.data || res;
    return response?.data || response || {};
  } catch (error) {
    console.error("Fetch My Timetable Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};
