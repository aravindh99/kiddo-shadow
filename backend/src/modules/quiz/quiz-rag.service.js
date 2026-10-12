import { GoogleGenAI } from "@google/genai";
import { Op, fn, col, where } from "sequelize";
import { buildQuizPrompt } from "./quiz-rag.prompts.js";
import Quiz from "./quiz.model.js";
import QuizQuestion from "./quiz-question.model.js";
import GameSession from "../game/game-session.model.js";
import GameSessionPlayer from "../game/game-session-player.model.js";
import PlayerAnswer from "../game/player-answer.model.js";
import AppError from "../../shared/appError.js";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function wantsTamilQuiz(topic = "", language = "") {
  const text = `${topic} ${language}`.toLowerCase();
  return /[\u0B80-\u0BFF]/.test(text) || /\b(tamil|tamizh|தமிழ்)\b/i.test(text);
}

function isQuotaError(err) {
  const status = Number(err?.status || err?.code || err?.error?.code || 0);
  const msg = String(err?.message || "").toLowerCase();
  return (
    status === 429 ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate limit")
  );
}

function fallbackQuizQuestions(topic, classLevel, count, language = "English") {
  const safeClass = classLevel || "school";
  const safeCount = Math.min(Math.max(count || 5, 1), 20);
  const isTamil = wantsTamilQuiz(topic, language);

  const rotate = (arr, by) => {
    const n = ((by % arr.length) + arr.length) % arr.length;
    return arr.slice(n).concat(arr.slice(0, n));
  };

  const makeQuestion = (questionText, correct, wrongA, wrongB, wrongC, seed) => {
    const options = rotate([correct, wrongA, wrongB, wrongC], seed % 4);
    const correctIndex = options.findIndex((o) => o === correct);
    return {
      question_text: questionText,
      options,
      correct_option_index: correctIndex < 0 ? 0 : correctIndex,
    };
  };

  if (isTamil) {
    const tamilRows = [
      makeQuestion(
        `வகுப்பு ${safeClass} மாணவர்களுக்கு "${topic}" பற்றி எது சரியான விளக்கம்?`,
        `"${topic}" என்பது படிப்பில் புரிந்து கொள்ள வேண்டிய முக்கிய கருத்தாகும்.`,
        `"${topic}" என்பது படிப்புடன் தொடர்பில்லாதது.`,
        `"${topic}" என்பது கேள்விகளை தவிர்ப்பது என்று பொருள்.`,
        `"${topic}" எளிய உதாரணங்களால் விளக்க முடியாதது.`,
        0
      ),
      makeQuestion(
        `"${topic}" கற்றுக்கொள்ள சிறந்த முறை எது?`,
        `முக்கிய கருத்துகளை புரிந்து கொண்டு உதாரணங்களைப் பயிற்சி செய்வது.`,
        `அர்த்தம் புரியாமல் பதில்களை மட்டும் மனப்பாடம் செய்வது.`,
        `ஆசிரியர் விளக்கத்தை கவனிக்காமல் இருப்பது.`,
        `பயிற்சி கேள்விகளை முழுவதும் தவிர்ப்பது.`,
        1
      ),
      makeQuestion(
        `"${topic}" படிக்கும் போது முதலில் என்ன செய்ய வேண்டும்?`,
        `அடிப்படை சொற்கள் மற்றும் கருத்துகளை தெளிவாகப் புரிந்து கொள்ள வேண்டும்.`,
        `முதலில் கடினமான கேள்விகளை மட்டும் செய்ய வேண்டும்.`,
        `காரணத்தைப் பார்க்காமல் இறுதி பதிலை மட்டும் பார்க்க வேண்டும்.`,
        `குறிப்புகள் மற்றும் உதாரணங்களை தவிர்க்க வேண்டும்.`,
        2
      ),
      makeQuestion(
        `"${topic}" பற்றி சரியான கூற்று எது?`,
        `${topic} உதாரணங்கள் மற்றும் மறுபயிற்சி மூலம் படிப்படியாக கற்றுக்கொள்ளலாம்.`,
        `${topic} பள்ளி மாணவர்களுக்கு பயனற்றது.`,
        `${topic} கற்க எந்த அடிப்படை கருத்தும் தேவையில்லை.`,
        `${topic} பற்றி கேள்விகள் கேட்பது தவறு.`,
        3
      ),
      makeQuestion(
        `"${topic}" இல் நல்ல மதிப்பெண் பெற எது உதவும்?`,
        `தொடர்ந்து பயிற்சி செய்து தவறுகளை திருத்திக் கொள்வது.`,
        `தவறுகளை பார்க்காமல் அடுத்த பாடத்துக்கு செல்வது.`,
        `ஒரே பதிலை எல்லா கேள்விக்கும் பயன்படுத்துவது.`,
        `கடைசி நேரத்தில் மட்டும் படிப்பது.`,
        4
      ),
      makeQuestion(
        `ஒரு மாணவர் "${topic}" இல் குழப்பமடைந்தால் என்ன செய்ய வேண்டும்?`,
        `அடிப்படையை மீண்டும் பார்த்து ஒரு எளிய உதாரணத்தை முயற்சி செய்ய வேண்டும்.`,
        `பாடத்தை முழுவதும் விட்டுவிட வேண்டும்.`,
        `கணிப்பால் மட்டும் பதில் தேர்வு செய்ய வேண்டும்.`,
        `உதவி கேட்காமல் இருக்க வேண்டும்.`,
        5
      ),
      makeQuestion(
        `"${topic}" புரிந்துள்ளது என்பதற்கான நல்ல அறிகுறி எது?`,
        `மாணவர் கருத்தை விளக்கி புதிய உதாரணத்தில் பயன்படுத்த முடியும்.`,
        `மாணவர் ஒரு வரியை மட்டும் மனப்பாடம் செய்கிறார்.`,
        `மாணவர் எல்லா பயிற்சியையும் தவிர்க்கிறார்.`,
        `மாணவர் பதிலை ஊகிக்கிறார்.`,
        6
      ),
      makeQuestion(
        `"${topic}" தேர்வுக்கு முன் சிறந்த மறுபயிற்சி திட்டம் எது?`,
        `முக்கிய விதிகளைப் பார்த்து கலப்பு கேள்விகளைப் பயிற்சி செய்து தவறுகளை சரிபார்ப்பது.`,
        `தலைப்புகளை மட்டும் படித்து உதாரணங்களை தவிர்ப்பது.`,
        `ஒரு பதில் முறையை மட்டும் மனப்பாடம் செய்வது.`,
        `தேர்வு தொடங்கும் வரை எந்த கேள்வியும் செய்யாமல் இருப்பது.`,
        7
      ),
    ];

    while (tamilRows.length < Math.max(safeCount * 3, 12)) {
      const seed = tamilRows.length;
      tamilRows.push(
        makeQuestion(
          `"${topic}" தொடர்பான நிலை ${seed - 7} இல் சரியான அணுகுமுறை எது?`,
          `${topic} கருத்தை சரியாகப் பயன்படுத்தி காரணத்துடன் பதில் காண்பது.`,
          `${topic} கருத்தை முற்றிலும் புறக்கணிப்பது.`,
          `புரிதலுக்கு பதிலாக ஊகிப்பது.`,
          `பதில் சரியா என்று சரிபார்க்காமல் விடுவது.`,
          seed
        )
      );
    }

    return tamilRows;
  }

  const topicLc = String(topic || "").toLowerCase();
  const isMathLike = /(algebra|geometry|equation|fraction|ratio|decimal|percent|trigonometry|calculus)/i.test(topicLc);
  const isScienceLike = /(photosynthesis|atom|cell|force|energy|electric|gravity|plant|human body|ecosystem|chemical|physics|biology|chemistry)/i.test(topicLc);
  const isSportsLike = /(football|soccer|cricket|hockey|basketball|volleyball|tennis|badminton|kabaddi|sport|sports)/i.test(topicLc);
  const isFootballLike = /(football|soccer)/i.test(topicLc);
  const isCricketLike = /(cricket)/i.test(topicLc);

  if (isFootballLike) {
    const footballRows = [
      makeQuestion(
        `How many players are usually on the field for one football team at a time?`,
        `11 players`,
        `7 players`,
        `9 players`,
        `15 players`,
        0
      ),
      makeQuestion(
        `What is the main objective in football?`,
        `To score goals by sending the ball into the opponent's net`,
        `To carry the ball with both hands across the line`,
        `To hit the ball over a high net`,
        `To knock down the opponent's wickets`,
        1
      ),
      makeQuestion(
        `Which player is allowed to use hands inside the penalty area in football?`,
        `Goalkeeper`,
        `Defender`,
        `Midfielder`,
        `Striker`,
        2
      ),
      makeQuestion(
        `What happens when the ball completely crosses the sideline in football?`,
        `A throw-in is awarded`,
        `A penalty is awarded automatically`,
        `The match ends`,
        `A goal is counted`,
        3
      ),
      makeQuestion(
        `Which body part is mainly used to control and pass the ball in football?`,
        `Feet`,
        `Hands`,
        `Bat`,
        `Racket`,
        4
      ),
      makeQuestion(
        `What is a penalty kick in football?`,
        `A direct shot at goal taken from the penalty mark after a foul`,
        `A free goal awarded without a shot`,
        `A goal scored from outside the stadium`,
        `A kick used only at the start of the match`,
        5
      ),
      makeQuestion(
        `Which tournament is the most famous international football competition?`,
        `FIFA World Cup`,
        `Wimbledon`,
        `Thomas Cup`,
        `Davis Cup`,
        6
      ),
      makeQuestion(
        `Which card usually means a player must leave the field immediately?`,
        `Red card`,
        `Green card`,
        `Blue card`,
        `White card`,
        7
      ),
      makeQuestion(
        `What is the place called where the football match is played?`,
        `Pitch`,
        `Court`,
        `Track`,
        `Pool`,
        8
      ),
      makeQuestion(
        `What is offside in football mainly related to?`,
        `An attacking player being in an unfair forward position`,
        `The ball going outside the stadium`,
        `A goalkeeper changing gloves`,
        `A team having too many substitutions`,
        9
      ),
    ];

    return footballRows.slice(0, Math.max(safeCount * 3, 10));
  }

  if (isCricketLike) {
    const cricketRows = [
      makeQuestion(
        `How many players are there in one cricket team?`,
        `11 players`,
        `7 players`,
        `9 players`,
        `15 players`,
        0
      ),
      makeQuestion(
        `What is the main aim of the batting team in cricket?`,
        `To score as many runs as possible`,
        `To score goals into a net`,
        `To throw the ball out of the stadium every time`,
        `To stop the match clock`,
        1
      ),
      makeQuestion(
        `What is the set of three vertical stumps with two bails called in cricket?`,
        `Wicket`,
        `Goalpost`,
        `Baseline`,
        `Touchline`,
        2
      ),
      makeQuestion(
        `How many runs are awarded when the ball crosses the boundary after touching the ground?`,
        `4 runs`,
        `2 runs`,
        `5 runs`,
        `6 runs`,
        3
      ),
      makeQuestion(
        `How many runs are awarded when the ball crosses the boundary without touching the ground?`,
        `6 runs`,
        `3 runs`,
        `4 runs`,
        `1 run`,
        4
      ),
      makeQuestion(
        `Which player delivers the ball to the batter in cricket?`,
        `Bowler`,
        `Goalkeeper`,
        `Defender`,
        `Referee`,
        5
      ),
      makeQuestion(
        `What is LBW in cricket?`,
        `Leg Before Wicket`,
        `Long Boundary Win`,
        `Last Batting Warning`,
        `Line Ball Wide`,
        6
      ),
      makeQuestion(
        `What is the rectangular area in the center of the field called in cricket?`,
        `Pitch`,
        `Court`,
        `Track`,
        `Penalty box`,
        7
      ),
      makeQuestion(
        `Who is the famous international tournament winner decided in the Cricket World Cup?`,
        `National cricket teams`,
        `Club football teams`,
        `Only school teams`,
        `Tennis doubles pairs`,
        8
      ),
      makeQuestion(
        `What is a wide ball in cricket?`,
        `A ball bowled too far from the batter to hit fairly`,
        `A ball that counts as six runs automatically`,
        `A ball that ends the innings immediately`,
        `A ball hit behind the wicket`,
        9
      ),
    ];

    return cricketRows.slice(0, Math.max(safeCount * 3, 10));
  }

  if (isSportsLike) {
    const sportName = String(topic || "sports").trim();
    const sportRows = [
      makeQuestion(
        `Which statement is correct about ${sportName}?`,
        `${sportName} is a recognized sport with its own rules and gameplay.`,
        `${sportName} is not played using any rules.`,
        `${sportName} never involves teams or players.`,
        `${sportName} has no scoring system in any form.`,
        0
      ),
      makeQuestion(
        `What is usually important in ${sportName}?`,
        `Knowing the rules, skills, and scoring method`,
        `Ignoring the rules completely`,
        `Playing without any objective`,
        `Ending the match without competition`,
        1
      ),
      makeQuestion(
        `Why do players practice ${sportName}?`,
        `To improve skill, coordination, and match performance`,
        `To avoid learning the rules`,
        `To reduce teamwork in the game`,
        `To remove scoring from the sport`,
        2
      ),
      makeQuestion(
        `Which is most likely part of ${sportName}?`,
        `Players, rules, scoring, and competition`,
        `No players and no rules`,
        `Only textbooks and no gameplay`,
        `No winner, no goal, and no skill`,
        3
      ),
    ];

    while (sportRows.length < Math.max(safeCount * 3, 10)) {
      const seed = sportRows.length;
      sportRows.push(
        makeQuestion(
          `What should a student know first about ${sportName}?`,
          `The basic rules and how points or results are decided`,
          `Only the color of the uniform`,
          `Nothing about the game format`,
          `How to play without following any rule`,
          seed
        )
      );
    }

    return sportRows.slice(0, Math.max(safeCount * 3, 10));
  }

  const templateFactories = [
    (seed) => makeQuestion(
      `What best defines "${topic}" for Class ${safeClass}?`,
      `"${topic}" is an important concept taught for Class ${safeClass}.`,
      `"${topic}" is unrelated to school learning outcomes.`,
      `"${topic}" means avoiding textbook concepts.`,
      `"${topic}" cannot be explained in simple classroom language.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which classroom activity best helps learn "${topic}"?`,
      `Practicing examples and discussing key ideas of ${topic}.`,
      `Skipping concept understanding and memorizing random facts.`,
      `Ignoring teacher explanations and doing no revision.`,
      `Avoiding diagrams, examples, and concept mapping.`,
      seed
    ),
    (seed) => makeQuestion(
      `Why is "${topic}" important for students?`,
      `It improves conceptual understanding and problem-solving ability.`,
      `It only helps in guessing answers without understanding.`,
      `It is useful only outside academics and never in exams.`,
      `It has no relation to real-world or curriculum learning.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which statement about "${topic}" is TRUE?`,
      `${topic} can be learned step-by-step using examples and revision.`,
      `${topic} cannot be learned unless advanced college methods are used.`,
      `${topic} should be avoided in school-level study plans.`,
      `${topic} has no foundational concepts to understand.`,
      seed
    ),
    (seed) => makeQuestion(
      `What should a student do first while studying "${topic}"?`,
      `Understand core terms and basic ideas before harder questions.`,
      `Start with hardest questions without concept revision.`,
      `Focus only on final answers and skip reasoning.`,
      `Avoid class notes and rely only on guesswork.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which habit most improves long-term learning in "${topic}"?`,
      `Regular revision with examples, notes, and self-checks.`,
      `Studying only the night before the exam.`,
      `Skipping corrections after making mistakes.`,
      `Reading answers without understanding the concepts.`,
      seed
    ),
    (seed) => makeQuestion(
      `A student is confused in "${topic}". What is the best next step?`,
      `Review the basic idea, solve one example, and then try again.`,
      `Memorize random options without reading the question.`,
      `Avoid asking for help and leave the topic fully.`,
      `Skip to unrelated lessons without understanding the base idea.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which study method is weakest for mastering "${topic}"?`,
      `Guessing answers without understanding why they are correct.`,
      `Reviewing class notes and textbook examples.`,
      `Practicing questions from easy to hard.`,
      `Checking mistakes and learning the corrected method.`,
      seed
    ),
    (seed) => makeQuestion(
      `What is a good sign that a student understands "${topic}"?`,
      `They can explain the idea and apply it to a fresh example.`,
      `They can only repeat one answer by heart.`,
      `They avoid all practice questions on the topic.`,
      `They rely on chance for every answer.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which revision plan is most useful before a "${topic}" quiz?`,
      `Review key rules, practice mixed questions, and check mistakes.`,
      `Read only headings and skip every example.`,
      `Memorize one answer pattern for every question.`,
      `Avoid solving anything until the exam starts.`,
      seed
    ),
  ];

  if (isMathLike) {
    templateFactories.push(
      (seed) => makeQuestion(
        `In ${topic}, what improves accuracy the most?`,
        `Solving step-by-step and checking each intermediate step.`,
        `Skipping steps to finish faster.`,
        `Ignoring units or signs and focusing only on the final number.`,
        `Avoiding practice of varied problem types.`,
        seed
      ),
      (seed) => makeQuestion(
        `When solving a ${topic} problem, what should be checked at the end?`,
        `Whether each step follows the rule correctly and the answer is reasonable.`,
        `Only whether the page looks full enough.`,
        `Whether the numbers were copied without thinking.`,
        `Only whether the final line is underlined.`,
        seed
      )
    );
  }

  if (isScienceLike) {
    templateFactories.push(
      (seed) => makeQuestion(
        `For "${topic}", which approach gives better understanding?`,
        `Using diagrams, cause-effect links, and real-life examples.`,
        `Memorizing isolated lines without context.`,
        `Ignoring process flow and key terminology.`,
        `Avoiding textbook explanations and teacher discussion.`,
        seed
      ),
      (seed) => makeQuestion(
        `Which science skill best supports learning "${topic}"?`,
        `Observing patterns and linking them to the concept clearly.`,
        `Ignoring vocabulary and process steps.`,
        `Remembering one sentence without meaning.`,
        `Skipping experiments, diagrams, and examples.`,
        seed
      )
    );
  }

  const rows = templateFactories.map((factory, index) => factory(index));
  const targetCount = Math.max(safeCount * 3, 12);

  while (rows.length < targetCount) {
    const seed = rows.length;
    rows.push(
      makeQuestion(
        `Which statement best applies "${topic}" in classroom situation ${seed - templateFactories.length + 1}?`,
        `It uses the main idea of ${topic} correctly and logically.`,
        `It ignores the concept of ${topic} completely.`,
        `It depends on guessing instead of understanding.`,
        `It avoids checking whether the idea is correct.`,
        seed
      )
    );
  }

  return rows;
}

function normalizeQuestionText(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getPreviouslyAskedQuestionTexts({ userId, topic }) {
  if (!userId || !String(topic || "").trim()) {
    return [];
  }

  const priorQuizzes = await Quiz.findAll({
    where: {
      owner_user_id: userId,
      [Op.and]: [where(fn("lower", col("topic")), String(topic).trim().toLowerCase())],
    },
    attributes: ["id"],
    order: [["created_at", "DESC"]],
    limit: 20,
  });

  const quizIds = priorQuizzes.map((quiz) => quiz.id).filter(Boolean);
  if (!quizIds.length) {
    return [];
  }

  const priorQuestions = await QuizQuestion.findAll({
    where: { quiz_id: { [Op.in]: quizIds } },
    attributes: ["question_text"],
    order: [["created_at", "DESC"]],
    limit: 100,
  });

  return Array.from(
    new Set(
      priorQuestions
        .map((question) => String(question.question_text || "").trim())
        .filter(Boolean)
    )
  );
}

function dedupeQuestions(questions = [], blockedQuestionTexts = []) {
  const blocked = new Set(blockedQuestionTexts.map((text) => normalizeQuestionText(text)));
  const seen = new Set();
  const unique = [];

  for (const question of questions) {
    const normalized = normalizeQuestionText(question?.question_text || question?.question);
    if (!normalized || blocked.has(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(question);
  }

  return unique;
}

function sanitizeAiQuestions(questions = []) {
  return (Array.isArray(questions) ? questions : [])
    .map((question) => {
      const rawOptions = Array.isArray(question?.options) ? question.options : [];
      const cleanedOptions = rawOptions
        .map((option) => String(option || "").trim())
        .filter(Boolean)
        .slice(0, 4);

      const uniqueOptions = Array.from(new Set(cleanedOptions));
      while (uniqueOptions.length < 4) {
        uniqueOptions.push(`Option ${String.fromCharCode(65 + uniqueOptions.length)}`);
      }

      const rawCorrectIndex =
        question?.correct_option_index !== undefined
          ? Number(question.correct_option_index)
          : Number(question?.correct_index);

      const safeCorrectIndex =
        Number.isInteger(rawCorrectIndex) && rawCorrectIndex >= 0 && rawCorrectIndex < uniqueOptions.length
          ? rawCorrectIndex
          : 0;

      return {
        question_text: String(question?.question_text || question?.question || "").trim(),
        options: uniqueOptions,
        correct_option_index: safeCorrectIndex,
      };
    })
    .filter(
      (question) =>
        question.question_text &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        question.options.every((option) => option)
    );
}

function buildQuestionReview(question, selectedIndex) {
  const selectedOptionIndex =
    typeof selectedIndex === "number" ? selectedIndex : null;
  const correctOptionIndex =
    typeof question.correct_option_index === "number"
      ? question.correct_option_index
      : null;

  return {
    questionId: question.id,
    questionText: question.question_text,
    options: Array.isArray(question.options) ? question.options : [],
    selectedOptionIndex,
    correctOptionIndex,
    selectedAnswer:
      selectedOptionIndex !== null ? question.options?.[selectedOptionIndex] ?? null : null,
    correctAnswer:
      correctOptionIndex !== null ? question.options?.[correctOptionIndex] ?? null : null,
    isCorrect:
      selectedOptionIndex !== null &&
      correctOptionIndex !== null &&
      selectedOptionIndex === correctOptionIndex,
  };
}

function fillMissingQuestions({
  questions,
  topic,
  classLevel,
  count,
  blockedQuestionTexts = [],
  language = "English",
}) {
  if (questions.length >= count) {
    return questions.slice(0, count);
  }

  const fallbackRows = fallbackQuizQuestions(topic, classLevel, Math.max(count * 3, 10), language);
  const remaining = dedupeQuestions(
    fallbackRows,
    blockedQuestionTexts.concat(questions.map((question) => question.question_text || question.question))
  );

  return questions.concat(remaining).slice(0, count);
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AppError("AI returned invalid quiz format", 502);
  }
  const jsonText = cleaned.slice(start, end + 1);
  return JSON.parse(jsonText);
}

export async function generateQuizFromAi({
  user,
  topic,
  classLevel,
  difficulty,
  numQuestions,
  language,
}) {
  const safeNumQuestions = Math.min(Math.max(numQuestions || 5, 1), 20);
  const safeDifficulty = difficulty || "MEDIUM";
  const safeClassLevel = classLevel || 5;
  const quizLanguage = wantsTamilQuiz(topic, language) ? "Tamil" : "English";
  const previouslyAskedQuestionTexts = await getPreviouslyAskedQuestionTexts({
    userId: user?.id,
    topic,
  });

  const prompt = buildQuizPrompt({
    topic,
    classLevel: safeClassLevel,
    difficulty: safeDifficulty,
    numQuestions: safeNumQuestions,
    excludedQuestionTexts: previouslyAskedQuestionTexts.slice(0, 30),
    language: quizLanguage,
  });

  let result;
  try {
    result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
  } catch (err) {
    console.error("Gemini AI Generation Error:", err);
    // AI failed (Quota, 503 Overload, 500, etc.): fallback to local quiz generation so API does not fail.
    const fallbackRows = fillMissingQuestions({
      questions: [],
      topic,
      classLevel: safeClassLevel,
      count: safeNumQuestions,
      blockedQuestionTexts: previouslyAskedQuestionTexts,
      language: quizLanguage,
    });
    if (fallbackRows.length < safeNumQuestions) {
      throw new AppError("Could not generate enough new quiz questions for this topic", 409);
    }
    const quiz = await Quiz.create({
      title: `${topic} Quiz`,
      topic,
      difficulty: safeDifficulty,
      num_questions: fallbackRows.length,
      owner_user_id: user.id,
    });

    const createdQuestions = await QuizQuestion.bulkCreate(
      fallbackRows.map((q, i) => ({
        quiz_id: quiz.id,
        order_index: i,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
      })),
      { returning: true }
    );

    return {
      quizId: quiz.id,
      questions: createdQuestions,
    };
  }
  const text =
    result.text ||
    result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    "";

  let parsed;
  try {
    parsed = extractJson(text);
  } catch {
    throw new AppError("AI returned invalid quiz format", 502);
  }

  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    throw new AppError("AI returned invalid quiz format", 502);
  }

  const preparedQuestions = fillMissingQuestions({
    questions: dedupeQuestions(sanitizeAiQuestions(parsed.questions), previouslyAskedQuestionTexts),
    topic,
    classLevel: safeClassLevel,
    count: safeNumQuestions,
    blockedQuestionTexts: previouslyAskedQuestionTexts,
    language: quizLanguage,
  });
  if (preparedQuestions.length < safeNumQuestions) {
    throw new AppError("Could not generate enough new quiz questions for this topic", 409);
  }

  const quiz = await Quiz.create({
    title: parsed.title || topic,
    topic,
    difficulty: safeDifficulty,
    num_questions: preparedQuestions.length,
    owner_user_id: user.id,
  });

  const questionRows = preparedQuestions.map((q, i) => ({
    quiz_id: quiz.id,
    order_index: i,
    question_text: q.question_text || q.question,
    options: q.options,
    correct_option_index:
      q.correct_option_index !== undefined
        ? q.correct_option_index
        : q.correct_index,
  }));

  const createdQuestions = await QuizQuestion.bulkCreate(questionRows, {
    returning: true,
  });

  return {
    quizId: quiz.id,
    questions: createdQuestions,
  };
}

export async function getSinglePlayerQuizReview({ sessionId, user }) {
  const session = await GameSession.findByPk(sessionId, {
    include: [{ model: Quiz, attributes: ["id", "title", "topic"] }],
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const player = await GameSessionPlayer.findOne({
    where: {
      session_id: sessionId,
      user_id: user.id,
    },
  });

  const isHostTeacher =
    user?.role === "teacher" && String(session.host_user_id) === String(user.id);

  if (!player && !isHostTeacher) {
    throw new AppError("Forbidden", 403);
  }

  const questions = await QuizQuestion.findAll({
    where: { quiz_id: session.quiz_id },
    order: [["order_index", "ASC"]],
  });

  const playerAnswers = player
    ? await PlayerAnswer.findAll({
        where: { session_player_id: player.id },
        order: [["created_at", "ASC"]],
      })
    : [];

  const answerMap = new Map(
    playerAnswers.map((answer) => [String(answer.question_id), answer.selected_option_index])
  );

  const review = questions.map((question) =>
    buildQuestionReview(question, answerMap.has(String(question.id)) ? answerMap.get(String(question.id)) : null)
  );

  const score = review.filter((item) => item.isCorrect).length;

  return {
    sessionId: session.id,
    mode: session.mode,
    quizId: session.quiz_id,
    quizTitle: session.Quiz?.title || session.Quiz?.topic || "Quiz",
    topic: session.Quiz?.topic || null,
    playerId: player?.id || null,
    score,
    total: review.length,
    review,
  };
}
