import api from "../../../api/axios";

// Single player
export const startSingleQuiz = (data) =>
  api.post("/game/quiz/single/start", data);

export const submitSingleQuiz = (payload) =>
  api.post("/game/quiz/single/submit", payload);

export const getQuizLeaderboard = (sessionId) =>
  api.get(`/game/quiz/${sessionId}/leaderboard`);

export const getSingleQuizReview = (sessionId) =>
  api.get(`/game/quiz/${sessionId}/review`);

export const getQuizHistory = (params) =>
  api.get("/game/quiz/history", { params });

// Multiplayer join (host or participant)
export const joinQuizRoom = ({ roomCode, sessionId }) =>
  api.post("/game/quiz/multi/join", { roomCode, sessionId });

// Multiplayer create
export const createMultiplayerQuiz = (payload) =>
  api.post("/game/quiz/multi/create", payload);

// Backward compatibility for existing hooks/components
export const createQuizSession = (data) =>
  joinQuizRoom({
    roomCode: data?.roomCode || (typeof data === "string" ? data : undefined),
    sessionId: data?.sessionId,
  });
export const joinQuizSession = (sessionId) =>
  joinQuizRoom({ sessionId });

// AI generated quiz (topic -> questions)
export const generateQuiz = (payload) =>
  api.post("/quiz/generate", payload, {
    maxRetries: 0,
    timeout: 30000,
  });

export const generateQuestionBankQuiz = (payload) =>
  api.post("/question-bank/generate", payload, {
    timeout: 30000,
  });

// Optional: legacy hook support
export const getQuizQuestions = (params) => {
  if (!params?.topic) {
    return Promise.reject(new Error("Quiz topic is required"));
  }
  return generateQuiz(params);
};
