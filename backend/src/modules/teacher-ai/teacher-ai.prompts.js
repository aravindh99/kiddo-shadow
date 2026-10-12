const isStemSubject = (subject = "") => {
  const normalized = String(subject).trim().toLowerCase();
  return ["math", "maths", "mathematics", "physics", "chemistry"].includes(normalized);
};

const buildStemGuidance = (subject = "") => {
  if (!isStemSubject(subject)) return "";

  return `
Additional STEM requirements:
- Include all relevant formulas and symbolic equations from the chapter where applicable.
- For numericals, include equation-based and formula-substitution style questions.
- For geometry, optics, circuits, graphs, chemical structures, apparatus, ray diagrams, free-body diagrams, or labelled scientific diagrams, explicitly ask students to draw neat labelled diagrams wherever relevant.
- Preserve scientific notation, units, chemical equations, mathematical symbols, and formula formatting.
- Do not replace formulas with plain descriptive text if the chapter uses equations.
`;
};

const toWholeNumber = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.floor(num);
};

const resolveQuestionPatternText = (questionPattern = {}) => {
  const customPatterns = []
    .concat(questionPattern?.patterns || questionPattern?.rows || [])
    .filter(Boolean)
    .map((item) => ({
      title: item?.title || String(item?.type || "Choose").replace(/_/g, " "),
      marks: Math.min(8, Math.max(1, toWholeNumber(item?.marks, 1))),
      count: toWholeNumber(item?.count, 0),
    }))
    .filter((item) => item.count > 0);

  if (customPatterns.length) {
    const totalMarks = customPatterns.reduce((sum, item) => sum + item.count * item.marks, 0);
    return [
      ...customPatterns.map((item) => `- ${item.title}: ${item.count} question(s) x ${item.marks} mark(s)`),
      `Total Marks: ${totalMarks}`,
    ].join("\n");
  }

  const oneMarkCount = Number(questionPattern?.one_mark_count ?? questionPattern?.oneMarkCount ?? 4) || 0;
  const twoMarkCount = Number(questionPattern?.two_mark_count ?? questionPattern?.twoMarkCount ?? 4) || 0;
  const threeMarkCount = Number(questionPattern?.three_mark_count ?? questionPattern?.threeMarkCount ?? 2) || 0;
  const fiveMarkCount = Number(questionPattern?.five_mark_count ?? questionPattern?.fiveMarkCount ?? 1) || 0;
  const totalMarks = oneMarkCount + twoMarkCount * 2 + threeMarkCount * 3 + fiveMarkCount * 5;

  return [
    `- Choose / Fill / Match / True or False: ${oneMarkCount} question(s) x 1 mark`,
    `- Short Answer: ${twoMarkCount} question(s) x 2 marks`,
    `- Short Answer: ${threeMarkCount} question(s) x 3 marks`,
    `- Paragraph / Long Answer: ${fiveMarkCount} question(s) x 5 marks`,
    `Total Marks: ${totalMarks}`,
  ].join("\n");
};

export const PROMPTS = {
  lesson_summary: ({ topic, classLevel, subject }) => `
You are a school teacher preparing for a class.

Create a clear lesson summary for:
Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}

The summary should:
- Be structured
- Include key concepts
- Be easy to explain to students
- Fit a 30–40 minute class
${buildStemGuidance(subject)}
`,

  question_paper: ({ subject, classLevel, chapter, marks, question_pattern: questionPattern, questionPattern: camelQuestionPattern }) => `
Create a CBSE-style question paper for:

Class: ${classLevel}
Subject: ${subject}
Chapter: ${chapter}
Total Marks: ${marks}

Instructions:
- Follow CBSE exam pattern
- Include a mix of difficulty levels
- Include chapter-relevant textbook terminology
- Follow this exact marks split:
${resolveQuestionPatternText(questionPattern || camelQuestionPattern)}

Paper structure:
- Group questions professionally by marks.
- Use the requested pattern titles such as Choose, Text, Fill Up, Match, True or False, Synonyms, Antonyms, Grammar, Paragraph, Short Answer, and Long Answer wherever provided.

Clearly mention marks for each question.
${buildStemGuidance(subject)}
`,

  quiz: ({ topic, classLevel }) => `
Create a quiz for:
Class: ${classLevel}
Topic: ${topic}

Rules:
- 10 multiple choice questions
- 4 options per question
- Clearly mark the correct answer
`,

  homework: ({ topic, classLevel, subject }) => `
Create homework for:
Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}

Include:
- 5 theory questions
- 5 application-based questions
- Clear instructions for students
`,
};
