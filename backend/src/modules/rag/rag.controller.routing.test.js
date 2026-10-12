import assert from "node:assert/strict";
import test from "node:test";

<<<<<<< HEAD
import {
  detectDirectGeminiTextRoute,
  selectDirectGeminiTextRoute,
} from "./rag.controller.js";
import { isAcademicSubjectRoute } from "./geminiSolver.js";

const classifyRoute = (question) =>
  detectDirectGeminiTextRoute(question) ? "GEMINI_SOLVER" : "RAG";
const classifySubjectRoute = (question, subject) =>
  detectDirectGeminiTextRoute(question, subject) ? "GEMINI_SOLVER" : "RAG";
=======
import { detectDirectGeminiTextRoute } from "./rag.controller.js";

const classifyRoute = (question) =>
  detectDirectGeminiTextRoute(question) ? "GEMINI_SOLVER" : "RAG";
>>>>>>> 6f072c33 (navigation button fixed for maths,physics,chemistry)

test("math_route_fix_01 routes place-value Indian-numbering questions to Gemini Solver", () => {
  assert.equal(
    classifyRoute("Observe the commas and write down the place value of 7. 56,74,56,345"),
    "GEMINI_SOLVER"
  );
});

test("math_route_fix_01 routes expanded-form questions to Gemini Solver", () => {
  assert.equal(classifyRoute("What is the expanded form of 76,70,905?"), "GEMINI_SOLVER");
});

test("math_route_fix_01 routes smallest digit-number place-value questions to Gemini Solver", () => {
  assert.equal(
    classifyRoute("How many ten thousands are there in the smallest 6 digit number?"),
    "GEMINI_SOLVER"
  );
});

test("math_general_reasoning_fix_v2 routes largest and smallest comparisons to Gemini Solver", () => {
  const question = "Which is largest and smallest among 1386787215, 137698890, 86720560";

  assert.equal(detectDirectGeminiTextRoute(question), "maths_reasoning");
  assert.equal(classifyRoute(question), "GEMINI_SOLVER");
});

test("math_general_reasoning_fix_v2 routes descending-order arrangements to Gemini Solver", () => {
  const question = "Arrange in descending order: 128435, 10835, 21354, 6348, 25840";

  assert.equal(detectDirectGeminiTextRoute(question), "maths_reasoning");
  assert.equal(classifyRoute(question), "GEMINI_SOLVER");
});

test("math_general_reasoning_fix_v2 routes constrained number construction to Gemini Solver", () => {
  const question = "Write any 8 digit number with constraints";

  assert.equal(detectDirectGeminiTextRoute(question), "maths_reasoning");
  assert.equal(classifyRoute(question), "GEMINI_SOLVER");
});

test("math_general_reasoning_fix_v2 does not route non-maths ordering prompts to Gemini Solver", () => {
  assert.equal(classifyRoute("Arrange the historical events in chronological order"), "RAG");
});

test("math_general_reasoning_fix_v2 leaves factual book questions on RAG", () => {
  assert.equal(classifyRoute("Who wrote The Discovery of India?"), "RAG");
});
<<<<<<< HEAD

test("subject-aware routing uses Maths context with existing fill-blank detection", () => {
  assert.equal(
    classifySubjectRoute("The smallest 7 digit number is ______", "Maths"),
    "GEMINI_SOLVER"
  );
});

test("subject-aware routing uses Maths context with existing reasoning detection", () => {
  assert.equal(
    detectDirectGeminiTextRoute(
      "Arrange the following numbers in descending order: 128435,10835,21354",
      "Maths"
    ),
    "maths_reasoning"
  );
  assert.equal(
    classifySubjectRoute(
      "Arrange the following numbers in descending order: 128435,10835,21354",
      "Maths"
    ),
    "GEMINI_SOLVER"
  );
});

test("subject-aware routing classifies numeric comparison as Maths reasoning", () => {
  assert.equal(
    detectDirectGeminiTextRoute(
      "Of the numbers 1386787215,137698890,86720560 which is largest?",
      "Maths"
    ),
    "maths_reasoning"
  );
});

test("subject-aware Maths routing wins before scoped-book RAG fallback", () => {
  assert.equal(
    selectDirectGeminiTextRoute({
      question:
        "Of the numbers 1386787215, 137698890, 86720560, which one is the largest? Which one is the smallest?",
      subject: "Maths",
      hasBookScope: true,
    }),
    "maths_reasoning"
  );
});

test("subject routing context passes the solver's internal academic gate", () => {
  const question =
    "Of the numbers 1386787215, 137698890, 86720560, which one is the largest? Which one is the smallest?";

  assert.equal(
    isAcademicSubjectRoute({ question, routingText: `${question} Maths` }),
    true
  );
});

test("subject-aware routing preserves fallback for ambiguous arrangement without subject", () => {
  assert.equal(classifySubjectRoute("Arrange numbers in descending order"), "RAG");
});

test("subject-aware routing uses Physics context with existing academic detection", () => {
  assert.equal(
    classifySubjectRoute("State Newton's law", "Physics"),
    "GEMINI_SOLVER"
  );
});

test("subject-aware routing supports Chemistry without affecting unsupported subjects", () => {
  assert.equal(
    classifySubjectRoute("State the law of conservation of mass", "Chemistry"),
    "GEMINI_SOLVER"
  );
  assert.equal(classifySubjectRoute("State the main idea", "History"), "RAG");
});
=======
>>>>>>> 6f072c33 (navigation button fixed for maths,physics,chemistry)
