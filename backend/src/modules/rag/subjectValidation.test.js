import assert from "node:assert/strict";
import test from "node:test";

import {
  detectQuestionSubject,
  detectQuestionSubjectSemantically,
  normalizeRequestSubject,
  normalizeSelectedSubject,
  resolveQuestionSubject,
  SUBJECT_INVALID_INPUT_RESPONSE,
  SUBJECT_MISMATCH_RESPONSE,
  SUBJECT_REQUIRED_RESPONSE,
  validateGeminiSolverSubject,
  validateQuestionSubject,
} from "./subjectValidation.js";

test("detects all supported subjects", () => {
  assert.equal(detectQuestionSubject("Solve x^2 - 2x - 1 = 0"), "Maths");
  assert.equal(detectQuestionSubject("Find the kinetic energy of a 2 kg body"), "Physics");
  assert.equal(detectQuestionSubject("Calculate the molarity of the NaCl solution"), "Chemistry");
  assert.equal(detectQuestionSubject("Prepare the trial balance from the ledger"), "Accounts");
  assert.equal(detectQuestionSubject("Explain the law of demand in a market"), "Commerce");
});

test("detects numeric largest and smallest questions as Maths", () => {
  const question =
    "Of the numbers 1386787215, 137698890, 86720560, which one is the largest? Which one is the smallest?";

  assert.equal(detectQuestionSubject(question), "Maths");
  assert.equal(
    validateQuestionSubject({ question, selectedSubject: "Maths" }).shouldReject,
    false
  );
});

test("accepts a matching selected subject", () => {
  assert.equal(
    validateQuestionSubject({
      question: "Calculate force when mass is 5 kg and acceleration is 2 m/s^2",
      subject: "Physics",
    }).isMatch,
    true
  );
});

test("rejects a mismatching selected subject", () => {
  const result = validateQuestionSubject({
    question: "Balance H2 + O2 -> H2O",
    subject: "Maths",
  });

  assert.equal(result.isMatch, false);
  assert.equal(result.shouldReject, true);
  assert.equal(result.detectedSubject, "Chemistry");
});

test("does not apply mismatch validation without a subject-button selection", () => {
  const result = validateQuestionSubject({
    question: "Find the kinetic energy of the object",
  });

  assert.equal(result.shouldReject, false);
  assert.equal(result.isMatch, true);
});

test("allows a selected subject when detection is not confident", () => {
  const result = validateQuestionSubject({
    question: "Explain this topic in simple words",
    subject: "Physics",
  });

  assert.equal(result.detectedSubject, null);
  assert.equal(result.shouldReject, false);
  assert.equal(result.isMatch, true);
});

test("allows permutation-style Maths questions without an explicit subject label", () => {
  const questions = [
    "In how many ways can 5 students be seated in a row?",
    "How many four-digit numbers can be formed from 1, 2, 3, 4 without repetition?",
  ];

  for (const question of questions) {
    const result = validateQuestionSubject({ question, selectedSubject: "Maths" });
    assert.equal(result.detectedSubject, "Maths");
    assert.equal(result.shouldReject, false);
  }
});

test("selected Maths accepts common Maths questions without an explicit subject label", () => {
  const questions = [
    "Find the value of 45 x 28",
    "Arrange 56, 78, 12, and 90 in descending order",
    "How many three digit numbers can be formed using 1, 2, 3 without repetition?",
    "How many thousands are there in 1 lakh?",
    "Express 9768854 in scientific notation",
    "Sita saved 225 and spent 400. Find due amount",
    "What is the formula for area of a rectangle?",
    "Define rational number",
    "A shopkeeper sold 24 pencils in the morning and 18 pencils in the evening. How many pencils did he sell altogether?",
  ];

  for (const question of questions) {
    const result = validateQuestionSubject({ question, selectedSubject: "Maths" });
    assert.equal(result.detectedSubject, "Maths");
    assert.equal(result.shouldReject, false);
  }
});

test("rejects common Maths questions when Physics or Chemistry is selected", () => {
  const cases = [
    {
      question: "Find the value of 45 x 28",
      selectedSubject: "Physics",
    },
    {
      question: "Arrange 56, 78, 12, and 90 in descending order",
      selectedSubject: "Chemistry",
    },
    {
      question: "How many three digit numbers can be formed using 1, 2, 3 without repetition?",
      selectedSubject: "Physics",
    },
    {
      question: "What is the formula for area of a rectangle?",
      selectedSubject: "Chemistry",
    },
    {
      question: "Define rational number",
      selectedSubject: "Physics",
    },
    {
      question: "A shopkeeper sold 24 pencils in the morning and 18 pencils in the evening. How many pencils did he sell altogether?",
      selectedSubject: "Chemistry",
    },
    {
      question: "What is 25% of 320?",
      selectedSubject: "Physics",
    },
    {
      question:
        "Sita saved ₹225.00 and she has spent ₹400 on credit basis for the purchase of stationery. Find her due amount.",
      selectedSubject: "Chemistry",
    },
    {
      question: "How many thousands are there in 1 lakh?",
      selectedSubject: "Physics",
    },
    {
      question: "How many thousands are there in 1 lakh?",
      selectedSubject: "Chemistry",
    },
    {
      question: "Express 9768854 in scientific notation",
      selectedSubject: "Physics",
    },
    {
      question: "Sita saved 225 and spent 400. Find due amount",
      selectedSubject: "Chemistry",
    },
  ];

  for (const testCase of cases) {
    const result = validateQuestionSubject(testCase);
    assert.equal(result.detectedSubject, "Maths");
    assert.equal(result.shouldReject, true);
  }
});

test("treats digit-formation questions as Maths only", () => {
  const question =
    "Rajan writes a 3-digit number, using the digits 4, 7 and 9. What are the possible numbers he can write?";

  assert.equal(detectQuestionSubject(question), "Maths");
  assert.equal(
    validateQuestionSubject({ question, selectedSubject: "Maths" }).shouldReject,
    false
  );
  assert.equal(
    validateQuestionSubject({ question, selectedSubject: "Physics" }).shouldReject,
    true
  );
  assert.equal(
    validateQuestionSubject({ question, selectedSubject: "Chemistry" }).shouldReject,
    true
  );
});

test("accepts valid selected-subject Gemini Solver questions", () => {
  const cases = [
    {
      question: "Find the area of a triangle with base 10 cm and height 5 cm.",
      selectedSubject: "Maths",
    },
    {
      question: "A body travels with velocity 20 m/s. Find its kinetic energy.",
      selectedSubject: "Physics",
    },
    {
      question: "Calculate density when mass is 50g and volume is 10cm³.",
      selectedSubject: "Chemistry",
    },
    {
      question: "A substance has a mass of 50g and volume of 10cm³. Find density.",
      selectedSubject: "Chemistry",
    },
  ];

  for (const testCase of cases) {
    const result = validateQuestionSubject(testCase);
    assert.equal(result.shouldReject, false);
    assert.equal(result.isMatch, true);
  }
});

test("rejects clear cross-subject questions before Gemini Solver", () => {
  const cases = [
    {
      question: "Solve x + 5 = 10.",
      selectedSubject: "Physics",
      detectedSubject: "Maths",
    },
    {
      question: "Explain atoms and molecules.",
      selectedSubject: "Maths",
      detectedSubject: "Chemistry",
    },
    {
      question: "Explain photosynthesis.",
      selectedSubject: "Maths",
      detectedSubject: "Biology",
    },
  ];

  for (const testCase of cases) {
    const result = validateQuestionSubject(testCase);
    assert.equal(result.detectedSubject, testCase.detectedSubject);
    assert.equal(result.shouldReject, true);
    assert.equal(result.isMatch, false);
  }
});

test("matches broad Maths Physics and Chemistry curriculum questions", () => {
  const cases = [
    {
      question: "Find the derivative of sin x with respect to x.",
      selectedSubject: "Maths",
      detectedSubject: "Maths",
    },
    {
      question: "Draw a histogram for the given class intervals and frequencies.",
      selectedSubject: "Maths",
      detectedSubject: "Maths",
    },
    {
      question: "Calculate the equivalent resistance of two resistors connected in parallel.",
      selectedSubject: "Physics",
      detectedSubject: "Physics",
    },
    {
      question: "Explain total internal reflection in optical fibres.",
      selectedSubject: "Physics",
      detectedSubject: "Physics",
    },
    {
      question: "Balance the chemical equation for magnesium reacting with oxygen.",
      selectedSubject: "Chemistry",
      detectedSubject: "Chemistry",
    },
    {
      question: "Find the empirical formula of a compound from its percentage composition.",
      selectedSubject: "Chemistry",
      detectedSubject: "Chemistry",
    },
  ];

  for (const testCase of cases) {
    const result = validateQuestionSubject(testCase);
    assert.equal(result.detectedSubject, testCase.detectedSubject);
    assert.equal(result.shouldReject, false);
    assert.equal(result.isMatch, true);
  }
});

test("button-selected subject has priority over text detection", () => {
  assert.deepEqual(
    resolveQuestionSubject({
      question: "Explain chemistry in simple words",
      selectedSubject: "Physics",
    }),
    { subject: "Physics", source: "selected" }
  );
});

test("normalizes other_subjects and skips mismatch validation for it", () => {
  assert.equal(normalizeSelectedSubject("other_subjects"), "Other Subjects");
  assert.equal(normalizeSelectedSubject("Other Subjects"), "Other Subjects");
  assert.equal(normalizeSelectedSubject("other subjects"), "Other Subjects");
  assert.equal(normalizeRequestSubject("other_subjects"), "Other Subjects");
  assert.equal(normalizeRequestSubject("Other Subjects"), "Other Subjects");
  assert.equal(normalizeRequestSubject("accounts"), null);

  const result = validateQuestionSubject({
    question: "Balance H2 + O2 -> H2O",
    selectedSubject: "other_subjects",
  });

  assert.equal(result.selectedSubject, "Other Subjects");
  assert.equal(result.detectedSubject, "Chemistry");
  assert.equal(result.shouldReject, false);
  assert.equal(result.isMatch, true);
});

test("other subjects routing validation accepts fallback subject field and general questions", () => {
  assert.deepEqual(
    resolveQuestionSubject({
      question: "Dr. A.P.J. Abdul Kalam",
      selectedSubject: "",
      subject: "other_subjects",
    }),
    { subject: "Other Subjects", source: "selected" }
  );

  const result = validateQuestionSubject({
    question: "Dr. A.P.J. Abdul Kalam",
    selectedSubject: "",
    subject: "Other Subjects",
  });

  assert.equal(result.selectedSubject, "Other Subjects");
  assert.equal(result.shouldReject, false);
});

test("subject validation responses use required routing messages", () => {
  assert.equal(SUBJECT_REQUIRED_RESPONSE.message, "Please select a specific subject.");
  assert.equal(SUBJECT_INVALID_INPUT_RESPONSE.validation, "INVALID_INPUT");
  assert.equal(SUBJECT_INVALID_INPUT_RESPONSE.message, "Missing subject or question input.");
  assert.equal(SUBJECT_MISMATCH_RESPONSE.message, "The selected subject does not match the question.");
});

test("legacy subject field also triggers button-subject resolution", () => {
  assert.deepEqual(
    resolveQuestionSubject({ question: "What is velocity?", subject: "Physics" }),
    { subject: "Physics", source: "selected" }
  );
});

test("falls back to question-text detection without a selected subject", () => {
  assert.deepEqual(
    resolveQuestionSubject({ question: "Solve this in maths: 2x + 1 = 5" }),
    { subject: "Maths", source: "detected" }
  );
});

test("blocks English questions submitted with a Maths button", () => {
  const result = validateQuestionSubject({
    question: "Identify the noun and adjective in this English sentence",
    selectedSubject: "Maths",
  });

  assert.equal(result.detectedSubject, "English");
  assert.equal(result.shouldReject, true);
});

test("blocks Social Science questions submitted with a Physics button", () => {
  const result = validateQuestionSubject({
    question: "Explain the fundamental rights in the Constitution",
    selectedSubject: "Physics",
  });

  assert.equal(result.detectedSubject, "Social Science");
  assert.equal(result.shouldReject, true);
});

test("treats each validation call independently", () => {
  assert.equal(
    validateQuestionSubject({ question: "Solve 2x + 4 = 10", subject: "Maths" }).isMatch,
    true
  );
  assert.equal(
    validateQuestionSubject({ question: "State Ohm's law", subject: "Chemistry" }).isMatch,
    false
  );
});

test("semantic Gemini Solver validation rejects mismatched selected subjects", async () => {
  const classifier = async () => '{"subject":"Maths","confidence":0.98}';

  const result = await validateGeminiSolverSubject({
    question: "What is 25% of 320?",
    selectedSubject: "Physics",
    classifier,
  });

  assert.equal(result.detectedSubject, "Maths");
  assert.equal(result.confidenceScore, 0.98);
  assert.equal(result.shouldReject, true);
  assert.equal(result.isMatch, false);
});

test("semantic Gemini Solver validation rejects missing runtime inputs before classifier", async () => {
  let classifierCalled = false;

  const result = await validateGeminiSolverSubject({
    question: "",
    selectedSubject: "Maths",
    classifier: async () => {
      classifierCalled = true;
      return '{"subject":"Maths","confidence":0.98}';
    },
  });

  assert.equal(result.isInvalidInput, true);
  assert.equal(result.detectedSubject, "Unknown");
  assert.equal(result.shouldReject, true);
  assert.equal(classifierCalled, false);
});

test("semantic Gemini Solver validation rejects raw placeholder inputs before classifier", async () => {
  let classifierCalled = false;

  const result = await validateGeminiSolverSubject({
    question: "{{question}}",
    selectedSubject: "{{selected_subject}}",
    classifier: async () => {
      classifierCalled = true;
      return '{"subject":"Maths","confidence":0.98}';
    },
  });

  assert.equal(result.isInvalidInput, true);
  assert.equal(result.detectedSubject, "Unknown");
  assert.equal(result.shouldReject, true);
  assert.equal(classifierCalled, false);
});

test("semantic Gemini Solver validation accepts matching selected subjects", async () => {
  const cases = [
    {
      question: "What is 25% of 320?",
      selectedSubject: "Maths",
      classifierSubject: "Maths",
    },
    {
      question: "A body moves with constant acceleration. Find its final velocity.",
      selectedSubject: "Physics",
      classifierSubject: "Physics",
    },
    {
      question: "Balance the equation Na + Cl2 -> NaCl",
      selectedSubject: "Chemistry",
      classifierSubject: "Chemistry",
    },
  ];

  for (const testCase of cases) {
    const result = await validateGeminiSolverSubject({
      question: testCase.question,
      selectedSubject: testCase.selectedSubject,
      classifier: async () => JSON.stringify({
        subject: testCase.classifierSubject,
        confidence: 0.99,
      }),
    });

    assert.equal(result.detectedSubject, testCase.classifierSubject);
    assert.equal(result.shouldReject, false);
    assert.equal(result.isMatch, true);
  }
});

test("semantic subject parser accepts plain classifier labels", async () => {
  assert.equal(
    await detectQuestionSubjectSemantically({
      question: "Explain photosynthesis",
      classifier: async () => "Other Subjects",
    }),
    "Other Subjects"
  );
});

test("semantic subject parser normalizes Mathematics labels", async () => {
  const result = await validateGeminiSolverSubject({
    question:
      "Sita saved ₹225.00 and she has spent ₹400 on credit basis for the purchase of stationery. Find her due amount.",
    selectedSubject: "Maths",
    classifier: async () => '{"subject":"Mathematics","confidence":0.98}',
  });

  assert.equal(result.detectedSubject, "Maths");
  assert.equal(result.rawDetectedSubject, "Mathematics");
  assert.equal(result.shouldReject, false);
  assert.equal(result.isMatch, true);
});

test("normalizes equivalent subject labels before Gemini Solver comparison", async () => {
  assert.equal(normalizeSelectedSubject("Mathematics Subject"), "Maths");
  assert.equal(normalizeSelectedSubject("School Mathematics"), "Maths");
  assert.equal(normalizeSelectedSubject("Physics Subject"), "Physics");
  assert.equal(normalizeSelectedSubject("Chemistry Subject"), "Chemistry");

  const mathsResult = await validateGeminiSolverSubject({
    question: "How many thousands are there in 1 lakh?",
    selectedSubject: "Maths",
    classifier: async () => '{"subject":"Mathematics Subject","confidence":0.98}',
  });
  const physicsResult = await validateGeminiSolverSubject({
    question: "Find the velocity of a body after 10 seconds.",
    selectedSubject: "Physics",
    classifier: async () => '{"subject":"Physics Subject","confidence":0.98}',
  });
  const chemistryResult = await validateGeminiSolverSubject({
    question: "Balance the equation Na + Cl2 -> NaCl",
    selectedSubject: "Chemistry",
    classifier: async () => '{"subject":"Chemistry Subject","confidence":0.98}',
  });

  assert.equal(mathsResult.rawDetectedSubject, "Mathematics Subject");
  assert.equal(mathsResult.detectedSubject, "Maths");
  assert.equal(mathsResult.shouldReject, false);
  assert.equal(physicsResult.detectedSubject, "Physics");
  assert.equal(physicsResult.shouldReject, false);
  assert.equal(chemistryResult.detectedSubject, "Chemistry");
  assert.equal(chemistryResult.shouldReject, false);
});

test("standalone mathematical representation is Maths, not Physics or Chemistry", async () => {
  const question = "Express in scientific notation 9768854";

  assert.equal(detectQuestionSubject(question), "Maths");
  assert.equal(
    (await validateGeminiSolverSubject({ question, selectedSubject: "Maths" })).shouldReject,
    false
  );
  assert.equal(
    (await validateGeminiSolverSubject({ question, selectedSubject: "Physics" })).shouldReject,
    true
  );
  assert.equal(
    (await validateGeminiSolverSubject({ question, selectedSubject: "Chemistry" })).shouldReject,
    true
  );
});

test("semantic classifier repair handles invalid first-pass output", async () => {
  const pureMathQuestion = "Express in scientific notation 9768854";
  const outputs = ["This looks like a notation question.", '{"subject":"Maths","confidence":0.96}'];

  const pureMathResult = await validateGeminiSolverSubject({
    question: pureMathQuestion,
    selectedSubject: "Maths",
    classifier: async () => outputs.shift(),
  });

  assert.equal(pureMathResult.detectedSubject, "Maths");
  assert.equal(pureMathResult.shouldReject, false);
});

test("physics notation context remains Physics", async () => {
  const question = "Express the speed of light, 300000000 m/s, in scientific notation.";

  const result = await validateGeminiSolverSubject({
    question,
    selectedSubject: "Physics",
    classifier: async () => '{"subject":"Physics","confidence":0.96}',
  });

  assert.equal(result.detectedSubject, "Physics");
  assert.equal(result.shouldReject, false);
});

test("semantic validator rejects wrong primary subject labels", async () => {
  const question = "Express in scientific notation 9768854";

  const result = await validateGeminiSolverSubject({
    question,
    selectedSubject: "Physics",
    classifier: async () => '{"subject":"Maths","confidence":0.97}',
  });

  assert.equal(result.detectedSubject, "Maths");
  assert.equal(result.shouldReject, true);
  assert.equal(result.isMatch, false);
});

test("semantic validator rejects place-value Maths under science subjects", async () => {
  const question = "How many thousands are there in 1 lakh?";

  const mathsResult = await validateGeminiSolverSubject({
    question,
    selectedSubject: "Maths",
    classifier: async () => '{"subject":"Mathematics","confidence":0.98}',
  });
  const physicsResult = await validateGeminiSolverSubject({
    question,
    selectedSubject: "Physics",
    classifier: async () => '{"subject":"Mathematics","confidence":0.98}',
  });
  const chemistryResult = await validateGeminiSolverSubject({
    question,
    selectedSubject: "Chemistry",
    classifier: async () => '{"subject":"Mathematics","confidence":0.98}',
  });

  assert.equal(mathsResult.detectedSubject, "Maths");
  assert.equal(mathsResult.shouldReject, false);
  assert.equal(physicsResult.detectedSubject, "Maths");
  assert.equal(physicsResult.shouldReject, true);
  assert.equal(chemistryResult.detectedSubject, "Maths");
  assert.equal(chemistryResult.shouldReject, true);
});

test("Gemini Solver fallback detects short Maths curriculum questions", async () => {
  const questions = [
    "How many thousands are there in 1 lakh?",
    "Express 9768854 in scientific notation",
    "Sita saved 225 and spent 400. Find due amount",
  ];

  for (const question of questions) {
    assert.equal(detectQuestionSubject(question), "Maths");

    const mathsResult = await validateGeminiSolverSubject({
      question,
      selectedSubject: "Maths",
    });
    const physicsResult = await validateGeminiSolverSubject({
      question,
      selectedSubject: "Physics",
    });

    assert.equal(mathsResult.detectedSubject, "Maths");
    assert.equal(mathsResult.solverAllowed, true);
    assert.equal(mathsResult.shouldReject, false);
    assert.equal(physicsResult.detectedSubject, "Maths");
    assert.equal(physicsResult.solverAllowed, false);
    assert.equal(physicsResult.shouldReject, true);
    assert.equal(SUBJECT_MISMATCH_RESPONSE.message, "The selected subject does not match the question.");
  }
});

test("method-priority classification keeps real-world arithmetic questions in Maths", async () => {
  const questions = [
    "A lift is 12 m above the ground and moves 7 m down. Find its current height.",
    "A runner covers 250 m in the morning and 175 m in the evening. Find the total distance covered.",
    "The temperature was 31 degrees and decreased by 6 degrees. What is the new temperature?",
  ];

  for (const question of questions) {
    assert.equal(detectQuestionSubject(question), "Maths");

    const mathsResult = await validateGeminiSolverSubject({
      question,
      selectedSubject: "Maths",
    });
    const physicsResult = await validateGeminiSolverSubject({
      question,
      selectedSubject: "Physics",
    });

    assert.equal(mathsResult.detectedSubject, "Maths");
    assert.equal(mathsResult.shouldReject, false);
    assert.equal(physicsResult.detectedSubject, "Maths");
    assert.equal(physicsResult.shouldReject, true);
  }
});

test("method-priority classification keeps physics formula questions in Physics", async () => {
  const question = "Calculate force when mass is 5 kg and acceleration is 2 m/s^2";

  assert.equal(detectQuestionSubject(question), "Physics");

  const result = await validateGeminiSolverSubject({
    question,
    selectedSubject: "Physics",
  });

  assert.equal(result.detectedSubject, "Physics");
  assert.equal(result.shouldReject, false);
});

test("Gemini Solver validation blocks when no detected subject is available", async () => {
  const result = await validateGeminiSolverSubject({
    question: "Explain this topic in simple words",
    selectedSubject: "Physics",
    classifier: async () => "",
  });

  assert.equal(result.detectedSubject, null);
  assert.equal(result.solverAllowed, false);
  assert.equal(result.shouldReject, true);
  assert.equal(result.isMatch, false);
});

test("chemistry notation context remains Chemistry", async () => {
  const question = "Express 0.000001 mol of NaCl in scientific notation.";

  const result = await validateGeminiSolverSubject({
    question,
    selectedSubject: "Chemistry",
    classifier: async () => '{"subject":"Chemistry","confidence":0.96}',
  });

  assert.equal(result.detectedSubject, "Chemistry");
  assert.equal(result.shouldReject, false);
});

test("commercial arithmetic fallback is Maths but accounting records are not", () => {
  const commercialArithmeticQuestion =
    "Sita saved ₹225.00 and she has spent ₹400 on credit basis for the purchase of stationery. Find her due amount.";
  const accountingQuestion = "Prepare the journal entry for goods purchased on credit.";

  assert.equal(detectQuestionSubject(commercialArithmeticQuestion), "Maths");
  assert.equal(
    validateQuestionSubject({
      question: commercialArithmeticQuestion,
      selectedSubject: "Maths",
    }).shouldReject,
    false
  );
  assert.equal(detectQuestionSubject(accountingQuestion), "Accounts");
});
