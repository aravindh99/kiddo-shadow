import { api } from "../../../services/api";

/* =========================
   LIST SUBJECTS
========================= */
export async function getSubjects() {
  const res = await api.get("/api/subjects");

  // handle all backend response shapes
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;

  return [];
}


/* =========================
   CREATE SUBJECT
========================= */
export const createSubject = async ({ name }) => {
  const res = await api.post("/api/subjects", { name });
  return res?.data;
};

/* =========================
   UPDATE SUBJECT
========================= */
export const updateSubject = async (id, { name }) => {
  const res = await api.patch(`/api/subjects/${id}`, { name });
  return res?.data;
};

/* =========================
   DELETE SUBJECT
========================= */
export const deleteSubject = async (id) => {
  await api.delete(`/api/subjects/${id}`);
};
