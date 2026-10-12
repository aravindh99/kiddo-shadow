import assert from "node:assert/strict";
import test from "node:test";

process.env.GEMINI_API_KEY = "";

const { solveWithGeminiFromTextbook } = await import("./geminiSolver.js");

test("place_value_reasoning_fix solves Indian-numbering place value without arithmetic fallback", async () => {
  const answer = await solveWithGeminiFromTextbook({
    question: "Observe the commas and write down the place value of 7.\n56,74,56,345",
    chunks: [],
    metadatas: [],
  });

  assert.match(answer, /Final Answer:\s*70,00,000/);
  assert.doesNotMatch(answer, /^Formula:/m);
  assert.doesNotMatch(answer, /^Given:/m);
  assert.doesNotMatch(answer, /^Substitution:/m);
  assert.doesNotMatch(answer, /^Calculation:/m);
});

test("place_value_reasoning_fix solves standard place value", async () => {
  const answer = await solveWithGeminiFromTextbook({
    question: "Place value of 5 in 7005380",
    chunks: [],
    metadatas: [],
  });

  assert.match(answer, /Final Answer:\s*5000/);
});

test("place_value_reasoning_fix solves face value directly", async () => {
  const answer = await solveWithGeminiFromTextbook({
    question: "Face value of 8 in 45892",
    chunks: [],
    metadatas: [],
  });

  assert.equal(answer, "Final Answer: 8");
});
