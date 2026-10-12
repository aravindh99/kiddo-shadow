import api from "../../api/axios";

export const getFoundationStageModules = async (mode = "basic") => {
  const res = await api.get("/foundation-stage/modules", {
    params: { mode },
  });
  return res?.data?.data || res?.data || res;
};

export const getFoundationStageModuleById = async (moduleId, mode = "basic") => {
  const res = await api.get(`/foundation-stage/modules/${moduleId}`, {
    params: { mode },
  });
  return res?.data?.data || res?.data || res;
};
