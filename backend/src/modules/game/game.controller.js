import User from "../users/user.model.js";
import { Op } from "sequelize";
import GameSession from "./game-session.model.js";
import GameSessionPlayer from "./game-session-player.model.js";
import PlayerAnswer from "./player-answer.model.js";
import Quiz from "../quiz/quiz.model.js";
import QuizQuestion from "../quiz/quiz-question.model.js";
import { generateQuizFromAi, getSinglePlayerQuizReview } from "../quiz/quiz-rag.service.js";
import { isTimeOver } from "./game.utils.js";
import AppError from "../../shared/appError.js";
import asyncHandler from "../../shared/asyncHandler.js";
import db from "../../config/db.js";

function generateRoomCode(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

export const submitSinglePlayerQuiz = asyncHandler(async (req, res) => {
  const { playerId, answers } = req.body;
  if (!playerId) {
    throw new AppError("playerId is required", 400);
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new AppError("answers must be a non-empty array", 400);
  }

  const player = await GameSessionPlayer.findByPk(playerId, {
    include: [{ model: GameSession }],
  });

  if (!player) {
    throw new AppError("Player not found", 404);
  }

  if (player.status === "FINISHED") {
    throw new AppError("Quiz already submitted", 409);
  }

  if (String(player.user_id) !== String(req.user.id)) {
    throw new AppError("Forbidden", 403);
  }

  const session =
    player.GameSession ||
    player.game_session ||
    (await GameSession.findByPk(player.session_id));

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  // ⬅️ AUTHORITATIVE TIME CHECK
  if (isTimeOver(session)) {
    if (session.status !== "FINISHED") {
      await session.update({ status: "FINISHED" });
    }
    throw new AppError("Time is over", 403);
  }

  let score = 0;
  const review = [];

  await db.transaction(async (t) => {
    for (const ans of answers) {
      const question = await QuizQuestion.findByPk(ans.questionId, { transaction: t });
      if (!question || String(question.quiz_id) !== String(session.quiz_id)) {
        throw new AppError(`Invalid question for this quiz: ${ans.questionId}`, 400);
      }

      const isCorrect =
        question.correct_option_index === ans.selectedIndex;

      if (isCorrect) score++;
      review.push({
        questionId: question.id,
        questionText: question.question_text,
        options: Array.isArray(question.options) ? question.options : [],
        selectedOptionIndex: ans.selectedIndex,
        correctOptionIndex: question.correct_option_index,
        selectedAnswer: question.options?.[ans.selectedIndex] ?? null,
        correctAnswer: question.options?.[question.correct_option_index] ?? null,
        isCorrect,
      });

      await PlayerAnswer.create(
        {
          session_player_id: playerId,
          question_id: ans.questionId,
          selected_option_index: ans.selectedIndex,
          is_correct: isCorrect,
        },
        { transaction: t }
      );
    }

    await player.update(
      {
        score,
        status: "FINISHED",
        finished_at: new Date(),
      },
      { transaction: t }
    );

    await session.update(
      {
        status: "FINISHED",
        ended_at: new Date(),
      },
      { transaction: t }
    );
  });

  res.json({
    score,
    total: review.length,
    review,
    sessionId: session.id,
    quizId: session.quiz_id,
    topic: null,
  });
});

export const getSinglePlayerQuizReviewController = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await getSinglePlayerQuizReview({
    sessionId,
    user: req.user,
  });

  res.json(result);
});

export const startSinglePlayerQuiz = asyncHandler(async (req, res) => {
  const { quizId, timeLimitMinutes } = req.body;
  const parsedQuizId = Number(quizId);
  const safeMinutes = Number(timeLimitMinutes) > 0 ? Number(timeLimitMinutes) : 5;

  if (!Number.isInteger(parsedQuizId) || parsedQuizId <= 0) {
    throw new AppError("Valid quizId is required", 400);
  }

  const quiz = await Quiz.findByPk(parsedQuizId);
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  const session = await GameSession.create({
    quiz_id: parsedQuizId,
    mode: "SINGLE",
    host_user_id: req.user.id,
    total_time_ms: safeMinutes * 60 * 1000,
    status: "IN_PROGRESS",
    started_at: new Date(),
  });

  const player = await GameSessionPlayer.create({
    session_id: session.id,
    user_id: req.user.id,
    is_host: true,
    status: "PLAYING",
  });

  res.json({ sessionId: session.id, playerId: player.id });
});

export const createMultiplayerQuiz = asyncHandler(async (req, res) => {
  const {
    topic,
    classLevel,
    difficulty,
    numQuestions,
    maxPlayers,
    timeLimitMinutes,
    language,
  } = req.body;

  if (!topic) {
    throw new AppError("Topic required", 400);
  }

  if (!req.user?.id) {
    throw new AppError("Valid user required to create multiplayer session", 400);
  }

  const quizResult = await generateQuizFromAi({
    user: req.user,
    topic,
    classLevel,
    difficulty,
    numQuestions,
    language,
  });

  let code = null;
  for (let i = 0; i < 10; i++) {
    const candidate = generateRoomCode(6);
    const existing = await GameSession.findOne({
      where: { room_code: candidate },
    });
    if (!existing) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    throw new AppError("Unable to allocate room code", 500);
  }

  const perQuestionMs = 30000;
  const totalQuestions =
    quizResult.questions?.length || numQuestions || 5;
  const totalTimeMs = timeLimitMinutes
    ? timeLimitMinutes * 60 * 1000
    : totalQuestions * perQuestionMs;

  const session = await GameSession.create({
    quiz_id: quizResult.quizId,
    mode: "MULTI",
    room_code: code,
    host_user_id: req.user.id,
    max_players: maxPlayers ?? null,
    total_time_ms: totalTimeMs,
    status: "LOBBY",
  });

  res.json({
    sessionId: session.id,
    roomCode: code,
    quizId: quizResult.quizId,
  });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await GameSession.findByPk(sessionId, {
    include: [{ model: Quiz, attributes: ["id", "title", "topic"] }],
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const totalQuestions = await QuizQuestion.count({
    where: { quiz_id: session.quiz_id },
  });
  const marksPerQuestion = 1;
  const totalMarks = totalQuestions * marksPerQuestion;

  const players = await GameSessionPlayer.findAll({
    where: { session_id: sessionId },
    include: [{ model: User, attributes: ["id", "name", "username", "avatar_url"] }],
    attributes: ["id", "user_id", "score", "status", "finished_at", "is_host"],
  });

  const answers = players.length
    ? await PlayerAnswer.findAll({
        where: {
          session_player_id: { [Op.in]: players.map((player) => player.id) },
        },
        attributes: ["session_player_id", "is_correct"],
        raw: true,
      })
    : [];

  const answerStats = answers.reduce((map, answer) => {
    const key = String(answer.session_player_id);
    const current = map.get(key) || { correctAnswers: 0, wrongAnswers: 0 };
    if (answer.is_correct) current.correctAnswers += 1;
    else current.wrongAnswers += 1;
    map.set(key, current);
    return map;
  }, new Map());

  const items = players
    .map((player) => {
      const plain = player.get({ plain: true });
      const user = plain.User || plain.user || {};
      const stats = answerStats.get(String(plain.id)) || {
        correctAnswers: Number(plain.score || 0),
        wrongAnswers: 0,
      };
      const score = stats.correctAnswers;
      const displayName =
        String(user.name || "").trim() ||
        String(user.username || "").trim() ||
        `Player ${plain.id}`;

      return {
        playerId: plain.id,
        userId: plain.user_id,
        displayName,
        avatarUrl: user.avatar_url || null,
        score,
        correctAnswers: stats.correctAnswers,
        wrongAnswers: stats.wrongAnswers,
        answeredCount: stats.correctAnswers + stats.wrongAnswers,
        totalQuestions,
        obtainedMarks: score * marksPerQuestion,
        totalMarks,
        marksPerQuestion,
        status: plain.status,
        finishedAt: plain.finished_at,
        isHost: plain.is_host,
        User: {
          id: user.id || plain.user_id,
          name: user.name || displayName,
          username: user.username || "",
          avatar_url: user.avatar_url || null,
        },
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return String(left.finishedAt || "").localeCompare(String(right.finishedAt || ""));
    });

  res.json({
    session: {
      id: session.id,
      mode: session.mode,
      quizId: session.quiz_id,
      quizTitle: session.Quiz?.title || session.Quiz?.topic || "Quiz",
      topic: session.Quiz?.topic || null,
      totalQuestions,
      marksPerQuestion,
      totalMarks,
    },
    items,
  });
});

export const joinMultiplayerQuiz = asyncHandler(async (req, res) => {
  const { roomCode, sessionId } = req.body;
  const normalizedCode = roomCode ? String(roomCode).toUpperCase() : "";
  const parsedSessionId = Number(sessionId);

  const session = Number.isInteger(parsedSessionId) && parsedSessionId > 0
    ? await GameSession.findByPk(parsedSessionId)
    : await GameSession.findOne({
        where: { room_code: normalizedCode },
      });

  if (!session) {
    throw new AppError("Room not found", 404);
  }

  // 👩‍🏫 TEACHER / HOST LOGIC
  // Teachers don't join as players. They just need the session ID to enter the lobby as host.
  if (req.user.role === "teacher") {
    // Optional: Check if this teacher is actually the host? 
    // Usually yes, but even if another teacher joins, maybe they just observe?
    // For now, allow any teacher to 'join' the view, but client handles "Start" button visibility based on ID.
    return res.json({
      sessionId: session.id,
      isTeacher: true,
      isHost: session.host_user_id === req.user.id,
    });
  }

  // 🎓 STUDENT LOGIC
  if (session.status === "FINISHED") {
    throw new AppError("Quiz already finished", 403);
  }

  if (isTimeOver(session)) {
    await session.update({ status: "FINISHED" });
    throw new AppError("Quiz time is over", 403);
  }

  const existing = await GameSessionPlayer.findOne({
    where: {
      session_id: session.id,
      user_id: req.user.id,
    },
  });

  if (existing) {
    return res.json({
      sessionId: session.id,
      playerId: existing.id,
    });
  }

  const count = await GameSessionPlayer.count({
    where: {
      session_id: session.id,
      status: { [Op.notIn]: ["DISCONNECTED", "FINISHED"] },
    },
  });

  if (session.max_players && count >= session.max_players) {
    throw new AppError("Room is full", 403);
  }

  const player = await GameSessionPlayer.create({
    session_id: session.id,
    user_id: req.user.id,
    is_host: session.host_user_id === req.user.id, // Should usually be false for students if teacher created it
    status: session.status === "IN_PROGRESS" ? "PLAYING" : "JOINED",
  });

  res.json({
    sessionId: session.id,
    playerId: player.id,
  });
});

// Quiz history for current user (single + multiplayer)
export const getQuizHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const myPlayers = await GameSessionPlayer.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: GameSession,
        attributes: [
          "id",
          "quiz_id",
          "mode",
          "room_code",
          "status",
          "started_at",
          "ended_at",
          "host_user_id",
        ],
        include: [
          {
            model: Quiz,
            attributes: ["id", "title", "topic"],
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
  });

  const hostedSessions = await GameSession.findAll({
    where: { host_user_id: req.user.id },
    include: [{ model: Quiz, attributes: ["id", "title", "topic"] }],
    attributes: [
      "id",
      "quiz_id",
      "mode",
      "room_code",
      "status",
      "started_at",
      "ended_at",
      "host_user_id",
    ],
    order: [["created_at", "DESC"]],
    limit,
  });

  const sessionIds = [
    ...new Set([
      ...myPlayers.map((p) => p.session_id),
      ...hostedSessions.map((s) => s.id),
    ]),
  ];

  const playersBySession = {};
  if (sessionIds.length) {
    const allPlayers = await GameSessionPlayer.findAll({
      where: { session_id: sessionIds },
      include: [{ model: User, attributes: ["id", "name", "avatar_url"] }],
      attributes: ["session_id", "score", "status", "user_id"],
    });

    for (const p of allPlayers) {
      if (!playersBySession[p.session_id]) {
        playersBySession[p.session_id] = [];
      }
      playersBySession[p.session_id].push({
        user_id: p.user_id,
        name: p.User?.name || "Player",
        avatar_url: p.User?.avatar_url || null,
        score: p.score ?? 0,
        status: p.status,
      });
    }
  }

  const quizIds = [
    ...new Set([
      ...myPlayers.map((p) => p.GameSession?.quiz_id).filter(Boolean),
      ...hostedSessions.map((s) => s.quiz_id).filter(Boolean),
    ]),
  ];

  const quizMap = {};
  if (quizIds.length) {
    const quizzes = await Quiz.findAll({
      where: { id: quizIds },
      attributes: ["id", "title", "topic"],
    });
    quizzes.forEach((q) => {
      quizMap[q.id] = q;
    });
  }

  const hostIds = [
    ...new Set(hostedSessions.map((s) => s.host_user_id).filter(Boolean)),
  ];
  const hostMap = {};
  if (hostIds.length) {
    const hosts = await User.findAll({
      where: { id: hostIds },
      attributes: ["id", "name", "avatar_url"],
    });
    hosts.forEach((h) => {
      hostMap[h.id] = h;
    });
  }

  const itemsMap = new Map();

  myPlayers.forEach((p) => {
    const fallbackQuiz = quizMap[p.GameSession?.quiz_id] || null;
    itemsMap.set(p.session_id, {
      session_id: p.session_id,
      mode: p.GameSession?.mode || "SINGLE",
      room_code: p.GameSession?.room_code || null,
      status:
        p.GameSession?.mode === "SINGLE"
          ? p.status || p.GameSession?.status || null
          : p.GameSession?.status || p.status || null,
      started_at: p.GameSession?.started_at || null,
      ended_at: p.GameSession?.ended_at || p.finished_at || null,
      quiz: {
        id: p.GameSession?.Quiz?.id || fallbackQuiz?.id || null,
        title:
          p.GameSession?.Quiz?.title ||
          p.GameSession?.Quiz?.topic ||
          fallbackQuiz?.title ||
          fallbackQuiz?.topic ||
          "Quiz",
        topic: p.GameSession?.Quiz?.topic || fallbackQuiz?.topic || null,
      },
      my_score: p.score ?? 0,
      players: playersBySession[p.session_id] || [],
    });
  });

  hostedSessions.forEach((s) => {
    if (!itemsMap.has(s.id)) {
      const fallbackQuiz = quizMap[s.quiz_id] || null;
      itemsMap.set(s.id, {
        session_id: s.id,
        mode: s.mode || "MULTI",
        room_code: s.room_code || null,
        status: s.status || null,
        started_at: s.started_at || null,
        ended_at: s.ended_at || null,
        quiz: {
          id: s.Quiz?.id || fallbackQuiz?.id || null,
          title:
            s.Quiz?.title ||
            s.Quiz?.topic ||
            fallbackQuiz?.title ||
            fallbackQuiz?.topic ||
            "Quiz",
          topic: s.Quiz?.topic || fallbackQuiz?.topic || null,
        },
        my_score: 0,
        players: playersBySession[s.id] || [],
      });
    }
  });

  const items = Array.from(itemsMap.values()).map((item) => {
    if (!item.players.length && item.mode === "MULTI") {
      const host = hostMap[
        hostedSessions.find((s) => s.id === item.session_id)?.host_user_id
      ];
      if (host) {
        item.players = [
          {
            user_id: host.id,
            name: host.name || "Host",
            avatar_url: host.avatar_url || null,
            score: 0,
            status: "HOST",
          },
        ];
      }
    }
    return item;
  }).sort(
    (a, b) => new Date(b.started_at || b.ended_at || 0) - new Date(a.started_at || a.ended_at || 0)
  );

  res.json({ success: true, items });
});
