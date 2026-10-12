import asyncHandler from "../../shared/asyncHandler.js";
import Quiz from "./quiz.model.js";
import QuizQuestion from "./quiz-question.model.js";
import { generateQuizFromAi } from "./quiz-rag.service.js";

export const createQuiz = asyncHandler(async (req, res) => {
  const {
    title,
    topic,
    topicId,
    difficulty,
    questions,
  } = req.body;

  const topicValue = topic ?? topicId;

  if (!questions || questions.length === 0) {
    return res.status(400).json({ message: "Questions required" });
  }
  if (!topicValue) {
    return res.status(400).json({ message: "Topic required" });
  }

  const quiz = await Quiz.create({
    title,
    topic: topicValue,
    difficulty,
    num_questions: questions.length,
    owner_user_id: req.user.id,
  });

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await QuizQuestion.create({
      quiz_id: quiz.id,
      order_index: i,
      question_text: q.question_text || q.question,
      options: q.options,
      correct_option_index:
        q.correct_option_index !== undefined
          ? q.correct_option_index
          : q.correctIndex,
    });
  }

  res.json({ quizId: quiz.id });
});

export const generateQuiz = asyncHandler(async (req, res) => {
  const {
    topic,
    classLevel,
    difficulty,
    numQuestions,
    language,
  } = req.body;

  if (!topic) {
    return res.status(400).json({ message: "Topic required" });
  }

  const result = await generateQuizFromAi({
    user: req.user,
    topic,
    classLevel,
    difficulty,
    numQuestions,
    language,
  });

  res.json({
    quizId: result.quizId,
    questions: result.questions,
  });
});
