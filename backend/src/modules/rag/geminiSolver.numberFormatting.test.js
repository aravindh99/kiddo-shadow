import assert from "node:assert/strict";
import test from "node:test";

process.env.GEMINI_API_KEY = "";

const { solveWithGeminiFromTextbook } = await import("./geminiSolver.js");

test("formats ungrouped numbers in the International System only", async () => {
  const answer = await solveWithGeminiFromTextbook({
    question: "Write 1234567 in International System using commas",
    chunks: [],
    metadatas: [],
  });

  assert.equal(answer, "1,234,567");
});

test("converts Indian-grouped numerals to International System grouping", async () => {
  const answer = await solveWithGeminiFromTextbook({
    question: "Write 56,74,56,345 in International System",
    chunks: [],
    metadatas: [],
  });

  assert.equal(answer, "567,456,345");
});

test("does not return formula or calculation steps for comma-formatting questions", async () => {
  const answer = await solveWithGeminiFromTextbook({
    question: "Insert commas in 123456789 using International System",
    chunks: [],
    metadatas: [],
  });

  assert.equal(answer, "123,456,789");
  assert.doesNotMatch(answer, /Formula|Given|Substitution|Calculation|Final Answer/i);
});
