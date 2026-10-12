import { api } from "../../../services/api";

/* GET sections by class */
export const getSectionsByClass = async (class_id) => {
  const res = await api.get(
    `/api/sections/classes/${class_id}/sections`
  );
  console.log("getSectionsByClass raw response:", res);
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

/* CREATE section */
export const createSection = async ({ class_id, name }) => {
  return api.post("/api/sections", {
    class_id: Number(class_id),
    name,
  });
};

/* UPDATE section status */
export const updateSectionStatus = async (id, is_active) => {
  return api.patch(`/api/sections/${id}/status`, {
    is_active,
  });
};

/* DELETE section */
export const deleteSection = async (id) => {
  return api.delete(`/api/sections/${id}`);
};
