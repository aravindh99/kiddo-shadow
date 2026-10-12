import api from "../../../api/axios";

export function getRelatedQuestions(question) {
  return api.post("/related-questions", { question });
}
