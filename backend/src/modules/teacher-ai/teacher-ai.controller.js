import asyncHandler from "../../shared/asyncHandler.js";
import { runTeacherAI } from "./teacher-ai.service.js";
import AppError from "../../shared/appError.js";

function hasImagePayload(payload = {}) {
  if (payload?.image_data || payload?.imageData || payload?.photo_data || payload?.photoData) {
    return true;
  }

  const pages = payload?.image_pages || payload?.imagePages || payload?.photo_pages || payload?.photoPages;
  return Array.isArray(pages) && pages.length > 0;
}

function normalizeAiType(input) {
  const raw = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["question_paper", "questionpaper", "question_paper_generator"].includes(raw)) {
    return "question_paper";
  }
  if (["lesson_summary", "lesson_plan_summary", "lessonplan_summary"].includes(raw)) {
    return "lesson_summary";
  }
  return raw;
}

function resolvePayload(body = {}) {
  if (body.payload && typeof body.payload === "object") {
    return body.payload;
  }
  if (body.data && typeof body.data === "object") {
    return body.data;
  }

  // Backward-compatible fallback: treat remaining keys as payload.
  const { aiType, type, payload, data, ...rest } = body;
  return rest;
}

export const teacherAiHandler = asyncHandler(async (req, res) => {
  const aiType = normalizeAiType(req.body?.aiType || req.body?.type);
  const payload = resolvePayload(req.body);

  if (!aiType) {
    throw new AppError("aiType is required", 400);
  }

  const result = await runTeacherAI({
    user: req.user,
    aiType,
    payload,
  });

  res.json({
    aiType,
    result,
  });
});

export const generateQuestionPaper = asyncHandler(async (req, res) => {
  const payload = resolvePayload(req.body);
  if (!payload?.classLevel) {
    throw new AppError("classLevel is required", 400);
  }
  if (!payload?.chapter && !payload?.topic && !hasImagePayload(payload)) {
    throw new AppError("chapter, topic, or captured image is required", 400);
  }

  const result = await runTeacherAI({
    user: req.user,
    aiType: "question_paper",
    payload,
  });

  res.json({
    aiType: "question_paper",
    result,
  });
});

export const generateLessonSummary = asyncHandler(async (req, res) => {
  const payload = resolvePayload(req.body);
  if (!payload?.classLevel) {
    throw new AppError("classLevel is required", 400);
  }
  if (!payload?.topic && !hasImagePayload(payload)) {
    throw new AppError("topic or captured image is required", 400);
  }

  const result = await runTeacherAI({
    user: req.user,
    aiType: "lesson_summary",
    payload,
  });

  res.json({
    aiType: "lesson_summary",
    result,
  });
});
