import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPostRagExplanationPrompt,
  normalizePostRagExplanationMode,
} from "./postRagExplanation.service.js";

test("normalizes supported post-RAG explanation modes", () => {
  assert.equal(normalizePostRagExplanationMode("short"), "short");
  assert.equal(normalizePostRagExplanationMode(" Detail "), "detail");
  assert.equal(normalizePostRagExplanationMode("details"), "detail");
  assert.equal(normalizePostRagExplanationMode("detailed"), "detail");
  assert.equal(normalizePostRagExplanationMode(" Brief "), "detail");
  assert.equal(normalizePostRagExplanationMode("long"), null);
});

test("builds a strict short prompt using the existing answer as source", () => {
  const prompt = buildPostRagExplanationPrompt({
    question: "What is evaporation?",
    answer: "Evaporation is the process in which water changes into water vapour.",
    mode: "short",
  });

  assert.match(prompt, /Question:\nWhat is evaporation\?/);
  assert.match(prompt, /Existing RAG answer:\nEvaporation is the process/);
  assert.match(prompt, /Use the existing RAG answer as the source content/);
  assert.match(prompt, /Do not explain what the question means/);
  assert.match(prompt, /Return 3 to 5 complete sentences/);
  assert.match(prompt, /Simplify this answer for a 6th standard student/);
  assert.match(prompt, /Return plain text only/);
  assert.doesNotMatch(prompt, /retrieval|embedding|vector|chroma/i);
});

test("detail mode asks for structured student-friendly points", () => {
  const prompt = buildPostRagExplanationPrompt({
    question: "Explain water cycle.",
    answer: "The water cycle is the continuous movement of water on Earth.",
    mode: "detail",
  });

  assert.match(prompt, /Expand this answer into a detailed explanation based on the given content/);
  assert.match(prompt, /Explain the topic, not the question/);
  assert.match(prompt, /Generate 10 to 15 structured points/);
  assert.match(prompt, /Organize with headings and numbered points/);
});
