import api from "../../api/axios";

export const getAcademicDomainExams = () =>
  api.get("/question-bank/exams");

export const generateAcademicDomainQuiz = (payload) =>
  api.post("/question-bank/generate", payload);
