import { api } from "@/services/api";

/* ==========================================================================
   CREATE REPORT CARD
   POST /api/report-cards
   body: { student_id, exam_id }
   ========================================================================== */
export async function createReportCard({ student_id, exam_id }) {
  try {
    const payload = {
      student_id: Number(student_id),
      exam_id: Number(exam_id),
    };

    const res = await api.post("/api/report-cards", payload);
    return res.data;
  } catch (error) {
    console.error("Create Report Card Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
}

/* ==========================================================================
   ADD / UPDATE MARKS
   POST /api/report-cards/:id/marks
   body: { marks: [{ subject_id, marks_obtained, max_marks }] }
   ========================================================================== */
export async function addReportMarks(reportCardId, marks = []) {
  try {
    if (!reportCardId) throw new Error("Report Card ID required.");

    const payload = {
      marks: marks.map((m) => ({
        subject_id: Number(m.subject_id),
        marks_obtained: Number(m.marks_obtained),
        max_marks: Number(m.max_marks),
      })),
    };

    const res = await api.post(
      `/api/report-cards/${reportCardId}/marks`,
      payload
    );

    return res.data;
  } catch (error) {
    console.error("Add Report Marks Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
}

/* ==========================================================================
   PUBLISH REPORT CARD
   POST /api/report-cards/:id/publish
   body: { remarks? }
   ========================================================================== */
export async function publishReportCard(reportCardId, remarks = "") {
  try {
    if (!reportCardId) throw new Error("Report Card ID required.");

    const payload = remarks ? { remarks } : {};

    const res = await api.post(
      `/api/report-cards/${reportCardId}/publish`,
      payload
    );

    return res.data;
  } catch (error) {
    console.error("Publish Report Card Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
}

/* ==========================================================================
   LIST REPORT CARDS (Converted to POST)
   POST /api/report-cards/list
   body: optional filters
   ========================================================================== */
export async function listReportCards(filters = {}) {
  try {
    const res = await api.post("/api/report-cards/list", filters);
    return res.data?.data || res.data || [];
  } catch (error) {
    console.error("List Report Cards Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
}

/* ==========================================================================
   GET REPORT CARD BY ID (Converted to POST)
   POST /api/report-cards/details
   body: { id }
   ========================================================================== */
export async function getReportCardById(id) {
  try {
    if (!id) throw new Error("Report Card ID required.");

    const res = await api.post("/api/report-cards/details", { id });
    return res.data;
  } catch (error) {
    console.error("Get Report Card By ID Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
}
