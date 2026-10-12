import api from "../../../api/axios";

export function checkGrammarWithGemini(payload) {
  return api.post("/mindscope/grammar/check", payload);
}

export function explainWordMeaningWithGemini(payload) {
  return api.post("/mindscope/meaning/explain", payload);
}
