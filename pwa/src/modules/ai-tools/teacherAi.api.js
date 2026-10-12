import api from "../../api/axios";

export const runTeacherAi = (aiType, payload) =>
  api.post("/teacher/ai", { aiType, payload });

export const generateQuestionPaper = (payload) =>
  api.post("/teacher/ai/question-paper", payload);

export const generateLessonSummary = (payload) =>
  api.post("/teacher/ai/lesson-summary", payload);
