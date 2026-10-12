export function buildQuizPrompt({
  topic,
  classLevel,
  difficulty,
  numQuestions,
  excludedQuestionTexts = [],
  language = "English",
}) {
  const avoidBlock = excludedQuestionTexts.length
    ? `
Previously used questions for this same topic that MUST NOT be repeated:
${excludedQuestionTexts.map((text, index) => `${index + 1}. ${text}`).join("\n")}
`
    : "";

  return `
You are a school exam question setter.

Create a quiz for:
Class: ${classLevel}
Topic: ${topic}
Difficulty: ${difficulty}
Number of questions: ${numQuestions}
Language: ${language}

Rules:
- Each question must have 4 options
- Only one correct option
- Difficulty must match
- Questions must be suitable for Class ${classLevel}
- The input may be a topic, phrase, or full question from a student
- If the input is a direct question, understand its meaning and generate quiz questions about that same subject
- Keep the quiz focused on the exact subject asked by the student
- Questions must be directly about the topic itself, not about study habits, exam strategy, or generic learning advice
- If the topic is a sport, ask about rules, players, terms, positions, scoring, tournaments, or equipment of that sport
- If the topic is a place, event, science idea, or subject, ask factual or concept-based questions about that exact topic
- Do not turn the topic into meta-questions like "how to learn ${topic}"
- If Language is Tamil, write the quiz title, every question, and every option fully in Tamil script
- If Language is Tamil, keep JSON keys in English but all student-facing text must be Tamil
- If the topic itself is in Tamil, treat Language as Tamil
- Every question must be different from the previously used questions listed below
- Avoid repeating the same wording, idea, or correct answer pattern
- Return ONLY valid JSON
- No explanation, no markdown, no text outside JSON

${avoidBlock}

JSON format:
{
  "title": "...",
  "questions": [
    {
      "question_text": "...",
      "options": ["...", "...", "...", "..."],
      "correct_option_index": 0
    }
  ]
}
`;
}
