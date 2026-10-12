import asyncHandler from "../../shared/asyncHandler.js";
import { checkMindScopeGrammar, explainMindScopeMeaning } from "./mindscope.service.js";

export const checkGrammar = asyncHandler(async (req, res) => {
  const data = await checkMindScopeGrammar({ text: req.body?.text });
  res.json(data);
});

export const explainMeaning = asyncHandler(async (req, res) => {
  const data = await explainMindScopeMeaning({ word: req.body?.word });
  res.json(data);
});
