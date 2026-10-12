import { api } from "@/services/api";

/**
 * LIST STUDENTS
 * GET /api/students
 */
export async function getStudents(params = {}) {
  try {
    const res = await api.get("/api/students", { params });

    // Deep extraction of the first visible array in standard response keys
    let items = [];
    let total = 0;

    if (Array.isArray(res)) {
      items = res;
    } else if (res && typeof res === "object") {
      // Check common keys: data, items, students, list, results
      const dataObj = res.data || res;
      if (Array.isArray(dataObj)) {
        items = dataObj;
      } else {
        items = dataObj.items || dataObj.students || dataObj.list || dataObj.results || [];
      }
      total = res.total || res.count || dataObj.total || items.length || 0;
    }

    return {
      total: Number(total),
      items: Array.isArray(items) ? items : [],
    };
  } catch (error) {
    console.error("Failed to fetch students:", error);
    throw error;
  }
}


/**
 * LIST STUDENTS (Alias for getStudents)
 */
export const listStudents = getStudents;

/**
 * GET STUDENTS COUNT FOR A PARTICULAR SCHOOL
 */
export async function getStudentsCount(schoolId) {
  try {
    const res = await getStudents({
      school_id: schoolId,
      schoolId: schoolId,
      status: 'all',
      limit: 1
    });
    return res.total || 0;
  } catch (error) {
    console.error(`Failed to get count for school ${schoolId}:`, error);
    return 0;
  }
}



/**
 * GET STUDENT OPTIONS
 * GET /api/students/options
 */
export async function getStudentOptions(params = {}) {
  try {
    const res = await api.get("/api/students/options", { params });
    return {
      total: res?.total || 0,
      items: Array.isArray(res?.items) ? res.items : [],
    };
  } catch (error) {
    console.error("Failed to fetch student options:", error);
    throw error;
  }
}

/**
 * CREATE STUDENT (ADMIN)
 * POST /api/students
 */
export async function createStudent(payload) {
  try {
    // Pass the full payload (name, username, gender, class_id, section_id)
    return await api.post("/api/students", payload);
  } catch (error) {
    console.error("Failed to create student:", error);
    throw error;
  }
}

/**
 * ASSIGN STUDENTS TO SECTION
 * POST /api/students/assign-section
 */
export async function assignStudentsToSection(payload) {
  try {
    return await api.post("/api/students/assign-section", payload);
  } catch (error) {
    console.error("Failed to assign students to section:", error);
    throw error;
  }
}

/**
 * MOVE STUDENT
 * PATCH /api/students/:id/move
 */
export async function moveStudent(id, sectionId) {
  try {
    return await api.patch(`/api/students/${id}/move`, {
      section_id: Number(sectionId),
    });
  } catch (error) {
    console.error("Failed to move student:", error);
    throw error;
  }
}

/**
 * UPDATE STUDENT STATUS
 * PATCH /api/students/:id/status
 */
export async function updateStudentStatus(id, isActive) {
  try {
    return await api.patch(`/api/students/${id}/status`, {
      is_active: Boolean(isActive),
    });
  } catch (error) {
    console.error("Failed to update student status:", error);
    throw error;
  }
}

/**
 * BULK CREATE STUDENTS
 * Since a dedicated /bulk route is not in the current router list,
 * we handle this by provisioning students individually.
 */
export async function bulkUploadStudents(payload) {
  try {
    const { class_id, section_id, students } = payload;
    const results = [];

    for (const studentData of students) {
      const studentPayload = {
        ...studentData,
        class_id: Number(class_id),
        section_id: Number(section_id)
      };
      const res = await createStudent(studentPayload);
      results.push(res);
    }

    return { message: "Batch processing completed", data: results };
  } catch (error) {
    console.error("Failed to execute bulk enrollment sequence:", error);
    throw error;
  }
}


