import api from "../../api/axios";

export const getLogicalThinkingOverview = async (params = {}) => {
  const res = await api.get("/logical-thinking", { params });
  return res?.data?.data || res?.data || res;
};

export const getGamifiedLearningOverview = async (params = {}) => {
  const res = await api.get("/gamified-learning", { params });
  return res?.data?.data || res?.data || res;
};

export const getGamifiedLearningProfile = async (params = {}) => {
  const res = await api.get("/gamified-learning/profile", { params });
  return res?.data?.data || res?.data || res;
};

export const getGamifiedLearningBadges = async (params = {}) => {
  const res = await api.get("/gamified-learning/badges", { params });
  return res?.data?.data || res?.data || res;
};

export const getGamifiedLearningLeaderboards = async (params = {}) => {
  const res = await api.get("/gamified-learning/leaderboard", { params });
  return res?.data?.data || res?.data || res;
};
