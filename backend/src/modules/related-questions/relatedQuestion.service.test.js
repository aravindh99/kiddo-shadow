import assert from "node:assert/strict";
import test from "node:test";
import {
  createRelatedQuestionService,
  extractKeywords,
} from "./relatedQuestion.service.js";

test("extracts distinct searchable keywords", () => {
  assert.deepEqual(extractKeywords("What is photosynthesis in plants?"), [
    "photosynthesis",
    "plants",
  ]);
});

test("returns exactly four unique questions from textbook content", async () => {
  const repository = {
    async searchByKeywords() {
      return [
        {
          id: "1",
          text:
            "Photosynthesis occurs in green plants. What is photosynthesis? Why is sunlight necessary for photosynthesis?",
          metadata: { subject: "science", chapter: "plants" },
        },
      ];
    },
  };
  const service = createRelatedQuestionService({ repository });
  const questions = await service.generate("How do plants perform photosynthesis?");

  assert.equal(questions.length, 4);
  assert.equal(new Set(questions).size, 4);
  assert.ok(questions.every((question) => question.endsWith("?")));
});

test("fails when no textbook content matches", async () => {
  const service = createRelatedQuestionService({
    repository: { searchByKeywords: async () => [] },
  });

  await assert.rejects(
    () => service.generate("What is photosynthesis?"),
    /No related textbook content found/
  );
});

test("keeps generated questions inside the best matching textbook chapter", async () => {
  const service = createRelatedQuestionService({
    repository: {
      async searchByKeywords() {
        return [
          {
            id: "plants-1",
            text: "Photosynthesis helps plants prepare food using sunlight.",
            metadata: { chapter: "Nutrition in Plants" },
          },
          {
            id: "plants-2",
            text: "What role does sunlight play in photosynthesis?",
            metadata: { chapter: "Nutrition in Plants" },
          },
          {
            id: "other-1",
            text: "What is nutrition in animals?",
            metadata: { chapter: "Nutrition in Animals" },
          },
        ];
      },
    },
  });

  const questions = await service.generate("Explain photosynthesis in plants");
  assert.equal(questions.length, 4);
  assert.ok(questions.every((question) => !/animals/i.test(question)));
});

test("selects the chapter with the strongest aggregate keyword coverage", async () => {
  const service = createRelatedQuestionService({
    repository: {
      async searchByKeywords() {
        return [
          {
            id: "water-1",
            text:
              "Energy must be saved. Energy conservation is important. How can water be conserved?",
            metadata: { chapter: "Water Conservation" },
          },
          {
            id: "solar-1",
            text:
              "Solar energy conversion changes sunlight into usable energy. What is solar energy conversion?",
            metadata: { chapter: "Solar Energy" },
          },
          {
            id: "solar-2",
            text: "Solar cells are devices used for solar energy conversion.",
            metadata: { chapter: "Solar Energy" },
          },
        ];
      },
    },
  });

  const questions = await service.generate("Explain solar energy conversion");
  assert.equal(questions.length, 4);
  assert.ok(questions.every((question) => !/water/i.test(question)));
  assert.ok(questions.every((question) => /solar|energy|conversion/i.test(question)));
});
