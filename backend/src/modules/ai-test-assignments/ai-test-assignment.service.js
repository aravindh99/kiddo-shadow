import { Op } from "sequelize";
import { GoogleGenAI } from "@google/genai";
import db from "../../config/db.js";
import AppError from "../../shared/appError.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Teacher from "../teachers/teacher.model.js";
import Student from "../students/student.model.js";
import User from "../users/user.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Subject from "../subjects/subject.model.js";
import Parent from "../parents/parent.model.js";
import AITestAssignment from "./ai-test-assignment.model.js";
import AITestSubmission from "./ai-test-submission.model.js";
import { listApprovedParentLinks } from "../parents/parent.family.service.js";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

function toPlain(instance) {
  return typeof instance?.get === "function" ? instance.get({ plain: true }) : instance;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampNumber(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function buildPersistedGeneratedMeta(meta = {}) {
  const safeMeta = typeof meta === "object" && meta !== null ? meta : {};
  return {
    source_type: safeMeta.source_type || null,
    sources: toArray(safeMeta.sources).slice(0, 10),
    filters_used: safeMeta.filters_used || null,
    image_used: Boolean(safeMeta.image_used),
    question_pattern: safeMeta.question_pattern || null,
    total_marks: safeMeta.total_marks || null,
    total_questions: safeMeta.total_questions || null,
  };
}

function getNow() {
  return new Date();
}

function getAssignmentQuestionList(content = "") {
  const questionBlock = String(content || "").split(/\*\*Teacher Reference Points\*\*/i)[0];

  return questionBlock
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, "").trim());
}

function getTeacherReferencePoints(content = "") {
  const [, referenceBlock = ""] = String(content || "").split(/\*\*Teacher Reference Points\*\*/i);

  return referenceBlock
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean);
}

function normalizeAnswerText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeAnswerText(value = "") {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "have",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "their",
    "this",
    "to",
    "was",
    "were",
    "with",
  ]);

  return Array.from(
    new Set(
      normalizeAnswerText(value)
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !stopWords.has(token))
    )
  );
}

function createBookAnswerFeedback(referencePoints = [], weakTopics = [], strongTopics = []) {
  const intro = "Corrected using the saved textbook reference points.";
  const strongLine = strongTopics.length
    ? `Strong textbook matches: ${strongTopics.join(", ")}.`
    : "Keep your answers closer to the textbook wording.";
  const weakLine = weakTopics.length
    ? `Revise these book points: ${weakTopics.join(", ")}.`
    : "Your answers covered the available textbook points well.";
  const sampleLine = referencePoints.length
    ? `Book answer reference: ${referencePoints.slice(0, 2).join(" | ")}`
    : "";

  return [intro, strongLine, weakLine, sampleLine].filter(Boolean).join(" ");
}

function evaluateSubmissionWithBookAnswers({ assignment, answers }) {
  const referencePoints = getTeacherReferencePoints(assignment.generated_content);
  if (!referencePoints.length) return null;

  const totalQuestions = Number(assignment.total_questions || getAssignmentQuestionList(assignment.generated_content).length || 0);
  const maxScore = Number(assignment.max_score || totalQuestions || 10);
  const perQuestionScore = totalQuestions > 0 ? maxScore / totalQuestions : 0;

  let score = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  const strongTopics = new Set();
  const weakTopics = new Set();

  for (const item of toArray(answers)) {
    const answer = String(item?.answer || "").trim();
    const answerTokens = tokenizeAnswerText(answer);

    if (!answerTokens.length) {
      wrongAnswers += 1;
      continue;
    }

    let bestMatch = { ratio: 0, reference: "" };

    for (const reference of referencePoints) {
      const referenceTokens = tokenizeAnswerText(reference);
      if (!referenceTokens.length) continue;
      const overlap = answerTokens.filter((token) => referenceTokens.includes(token)).length;
      const ratio = overlap / referenceTokens.length;
      if (ratio > bestMatch.ratio) {
        bestMatch = { ratio, reference };
      }
    }

    if (bestMatch.ratio >= 0.6) {
      score += perQuestionScore;
      correctAnswers += 1;
      if (bestMatch.reference) strongTopics.add(bestMatch.reference);
      continue;
    }

    if (bestMatch.ratio >= 0.3) {
      score += perQuestionScore * 0.5;
      if (bestMatch.reference) {
        strongTopics.add(bestMatch.reference);
        weakTopics.add(bestMatch.reference);
      }
      continue;
    }

    wrongAnswers += 1;
    if (bestMatch.reference) weakTopics.add(bestMatch.reference);
  }

  const roundedScore = clampNumber(Number(score.toFixed(2)), 0, maxScore);
  const percentage = maxScore ? Number(((roundedScore / maxScore) * 100).toFixed(2)) : 0;
  const strongTopicList = Array.from(strongTopics).slice(0, 5);
  const weakTopicList = Array.from(weakTopics)
    .filter((topic) => !strongTopics.has(topic) || weakTopics.size === 1)
    .slice(0, 5);

  return {
    score: roundedScore,
    percentage,
    correct_answers: clampNumber(correctAnswers, 0, totalQuestions || correctAnswers),
    wrong_answers: clampNumber(wrongAnswers, 0, totalQuestions || wrongAnswers),
    strong_topics: strongTopicList,
    weak_topics: weakTopicList,
    feedback: createBookAnswerFeedback(referencePoints, weakTopicList, strongTopicList),
    evaluation_source: "fallback",
  };
}

function formatTimeTaken(seconds) {
  const safe = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (!mins) return `${secs}s`;
  if (!secs) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

function formatSubmissionDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function calculateAttemptStatus(assignment, submission) {
  const now = getNow();
  const startTime = assignment.start_time ? new Date(assignment.start_time) : null;
  const endTime = assignment.end_time ? new Date(assignment.end_time) : null;
  const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;

  if (submission.status === "completed" || submittedAt) return "completed";
  if (submission.status === "missed") return "missed";
  if (startTime && now < startTime) return "pending";
  if (endTime && now > endTime) return "missed";

  if (assignment.has_time_limit && assignment.duration_minutes && submission.started_at && !submittedAt) {
    const deadline = new Date(submission.started_at).getTime() + assignment.duration_minutes * 60 * 1000;
    if (now.getTime() > deadline) return "missed";
  }

  if (submission.started_at) return "in_progress";
  return "pending";
}

async function refreshSubmissionState(submission, assignment) {
  const nextStatus = calculateAttemptStatus(assignment, submission);
  if (nextStatus !== submission.status) {
    const patch = { status: nextStatus };
    if (nextStatus === "missed" && !submission.submitted_at) {
      patch.submitted_at = getNow();
      if (submission.started_at) {
        patch.time_taken_seconds = Math.max(
          0,
          Math.round((patch.submitted_at.getTime() - new Date(submission.started_at).getTime()) / 1000)
        );
      }
    }
    await submission.update(patch);
  }
  return submission;
}

function canViewResult(assignment, submission, role = "student") {
  if (role === "teacher") return true;
  if (assignment.result_visibility === "hidden") return false;
  if (assignment.result_visibility === "after_review") {
    return Boolean(submission.result_published_at || submission.teacher_reviewed_at);
  }
  return submission.status === "completed" || Boolean(submission.result_published_at);
}

function buildUnifiedResult({ assignment, submission, student, role }) {
  const className = assignment?.class?.class_name || assignment?.Class?.class_name || assignment?.class_name || "";
  const sectionName = assignment?.section?.name || assignment?.Section?.name || assignment?.section_name || "";
  const studentUser = student?.user || student?.User || {};
  const status = calculateAttemptStatus(assignment, submission);
  const visible = canViewResult(assignment, submission, role);
  const maxScore = Number(assignment.max_score || 0);
  const score = visible ? Number(submission.score || 0) : null;
  const percentage = visible ? Number(submission.percentage || 0) : null;

  return {
    assignment_id: assignment.id,
    submission_id: submission.id,
    student_id: submission.student_id,
    student_name: studentUser.name || student?.name || "Student",
    class_section: [className, sectionName].filter(Boolean).join("-"),
    test_title: assignment.title,
    subject: assignment.subject_name || assignment?.subject?.name || "General",
    chapter_name: assignment.chapter_name || "",
    score,
    max_score: maxScore,
    score_display: visible && maxScore ? `${score}/${maxScore}` : null,
    percentage,
    submitted_at: formatSubmissionDate(submission.submitted_at),
    time_taken_seconds: submission.time_taken_seconds || 0,
    time_taken_label: formatTimeTaken(submission.time_taken_seconds || 0),
    attempt_status: status,
    correct_answers: visible ? Number(submission.correct_answers || 0) : null,
    wrong_answers: visible ? Number(submission.wrong_answers || 0) : null,
    weak_topics: visible ? toArray(submission.weak_topics) : [],
    strong_topics: visible ? toArray(submission.strong_topics) : [],
    feedback: visible ? submission.feedback || "" : "",
    status_label: status === "completed" ? "Completed" : status === "missed" ? "Not Attempted" : "Pending",
    progress_value: visible ? clampNumber(percentage || 0, 0, 100) : 0,
    result_visible: visible,
    result_visibility: assignment.result_visibility,
    lock_mode: Boolean(assignment.lock_mode),
    start_time: assignment.start_time,
    end_time: assignment.end_time,
    duration_minutes: assignment.duration_minutes,
  };
}

async function ensureTeacherCanManageAssignment({ schoolId, teacherId, classId, sectionId, subjectId }) {
  const where = {
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: classId,
    section_id: sectionId,
    is_active: true,
  };

  if (subjectId) {
    where[Op.or] = [{ subject_id: subjectId }, { is_class_teacher: true }];
  }

  const assignment = await TeacherAssignment.findOne({ where });
  if (!assignment) throw new AppError("You are not assigned to this class/section", 403);
  return assignment;
}

async function getStudentsForAssignment({ schoolId, classId, sectionId, studentIds }) {
  const where = {
    school_id: schoolId,
    class_id: classId,
    section_id: sectionId,
    is_active: true,
    approval_status: "approved",
  };

  if (Array.isArray(studentIds) && studentIds.length > 0) {
    where.id = studentIds.map((id) => Number(id)).filter(Boolean);
  }

  return Student.findAll({
    where,
    include: [{ model: User, attributes: ["id", "name", "username"] }],
    order: [[User, "name", "ASC"]],
  });
}

async function evaluateSubmissionWithAI({ assignment, answers }) {
  const bookEvaluation = evaluateSubmissionWithBookAnswers({ assignment, answers });
  if (bookEvaluation) {
    return bookEvaluation;
  }

  const questions = getAssignmentQuestionList(assignment.generated_content);
  const answerText = toArray(answers)
    .map((item, index) => `Q${index + 1}: ${String(item?.answer || "").trim() || "[No answer]"}`)
    .join("\n\n");

  const fallbackMaxScore = Number(assignment.max_score || questions.length || 10);

  if (!ai) {
    throw new AppError("Gemini correction is not available right now. Please try again.", 503);
  }

  const prompt = `
You are grading a school test submission. Return ONLY valid JSON.

Test title: ${assignment.title}
Subject: ${assignment.subject_name || "General"}
Chapter: ${assignment.chapter_name || "General"}
Total questions: ${assignment.total_questions || questions.length || 0}
Maximum score: ${fallbackMaxScore}

Question paper:
${assignment.generated_content}

Student answers:
${answerText}

Return JSON with this exact shape:
{
  "score": number,
  "percentage": number,
  "correct_answers": number,
  "wrong_answers": number,
  "strong_topics": ["..."],
  "weak_topics": ["..."],
  "feedback": "..."
}

Rules:
- Use score range 0 to ${fallbackMaxScore}.
- Keep strong_topics and weak_topics concise.
- Be supportive and student-friendly in feedback.
- If answers are mostly blank, score very low and mention missing responses.
`;

  try {
    const result = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
    const text = result.text || result?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
    const cleaned = String(text || "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const score = clampNumber(parsed.score, 0, fallbackMaxScore);
    const percentage = clampNumber(parsed.percentage ?? (fallbackMaxScore ? (score / fallbackMaxScore) * 100 : 0), 0, 100);

    return {
      score,
      percentage: Number(percentage.toFixed(2)),
      correct_answers: clampNumber(parsed.correct_answers, 0, assignment.total_questions || questions.length || 0),
      wrong_answers: Math.max(
        0,
        clampNumber(parsed.wrong_answers, 0, assignment.total_questions || questions.length || parsed.wrong_answers || 0)
      ),
      strong_topics: toArray(parsed.strong_topics).slice(0, 5),
      weak_topics: toArray(parsed.weak_topics).slice(0, 5),
      feedback: String(parsed.feedback || "").trim(),
      evaluation_source: "ai",
    };
  } catch {
    throw new AppError("Gemini could not evaluate this submission right now. Please try again.", 502);
  }
}

export async function createAssignedTest({ user, payload }) {
  const teacherId = user.teacher_id;
  const classId = Number(payload.class_id);
  const sectionId = Number(payload.section_id);
  const subjectId = payload.subject_id ? Number(payload.subject_id) : null;

  if (!classId || !sectionId) throw new AppError("class_id and section_id are required", 400);
  if (!payload.generated_content) throw new AppError("generated_content is required", 400);

  await ensureTeacherCanManageAssignment({
    schoolId: user.school_id,
    teacherId,
    classId,
    sectionId,
    subjectId,
  });

  const [teacher, cls, section, subject] = await Promise.all([
    Teacher.findByPk(teacherId),
    Class.findOne({ where: { id: classId, school_id: user.school_id } }),
    Section.findOne({ where: { id: sectionId, class_id: classId, school_id: user.school_id } }),
    subjectId ? Subject.findOne({ where: { id: subjectId, school_id: user.school_id } }) : null,
  ]);

  if (!teacher || !cls || !section) throw new AppError("Assignment context not found", 404);

  const assignFullClass = Boolean(payload.assign_full_class);
  const studentIds = assignFullClass ? [] : toArray(payload.student_ids);
  const students = await getStudentsForAssignment({
    schoolId: user.school_id,
    classId,
    sectionId,
    studentIds,
  });

  if (!students.length) throw new AppError("No students available for this assignment", 400);

  const totalQuestions = Number(payload.total_questions) || getAssignmentQuestionList(payload.generated_content).length || 0;
  const maxScore = Number(payload.max_score || payload.total_marks || totalQuestions || 10);

  const assignment = await db.transaction(async (transaction) => {
    const created = await AITestAssignment.create(
      {
        school_id: user.school_id,
        teacher_id: teacherId,
        class_id: classId,
        section_id: sectionId,
        subject_id: subjectId,
        title: payload.title || `${subject?.name || payload.subject || "General"} Test`,
        subject_name: payload.subject || subject?.name || "General",
        chapter_name: payload.chapter || payload.topic || "",
        generated_content: payload.generated_content,
        generated_meta: buildPersistedGeneratedMeta(payload.generated_meta),
        total_questions: totalQuestions,
        max_score: maxScore,
        duration_minutes: payload.has_time_limit ? Number(payload.duration_minutes || 0) || null : null,
        start_time: toDateOrNull(payload.start_time),
        end_time: toDateOrNull(payload.end_time),
        has_time_limit: Boolean(payload.has_time_limit),
        lock_mode: true,
        allow_retry: Boolean(payload.allow_retry),
        result_visibility: payload.result_visibility || "immediate",
        assigned_scope: assignFullClass ? "full_class" : "selected_students",
      },
      { transaction }
    );

    await AITestSubmission.bulkCreate(
      students.map((student) => ({
        assignment_id: created.id,
        school_id: user.school_id,
        student_id: student.id,
        status: "pending",
      })),
      { transaction }
    );

    return created;
  });

  return getTeacherAssignmentDetail({ user, assignmentId: assignment.id });
}

async function loadTeacherAssignmentScope({ user, assignmentId }) {
  const assignment = await AITestAssignment.findOne({
    where: {
      id: assignmentId,
      school_id: user.school_id,
      teacher_id: user.teacher_id,
      is_active: true,
    },
    include: [
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
      { model: Subject, attributes: ["id", "name"] },
      {
        model: AITestSubmission,
        include: [
          {
            model: Student,
            attributes: ["id", "roll_no", "admission_no", "class_id", "section_id"],
            include: [{ model: User, attributes: ["id", "name", "username"] }],
          },
        ],
      },
    ],
    order: [[AITestSubmission, "created_at", "ASC"]],
  });

  if (!assignment) throw new AppError("Assigned test not found", 404);

  for (const submission of assignment.ai_test_submissions || []) {
    await refreshSubmissionState(submission, assignment);
  }

  return assignment;
}

export async function listTeacherAssignments({ user }) {
  const rows = await AITestAssignment.findAll({
    where: {
      school_id: user.school_id,
      teacher_id: user.teacher_id,
      is_active: true,
    },
    include: [
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
      { model: Subject, attributes: ["id", "name"] },
      { model: AITestSubmission, attributes: ["id", "status", "score", "percentage"] },
    ],
    order: [["created_at", "DESC"]],
  });

  return rows.map((row) => {
    const plain = toPlain(row);
    const submissions = toArray(plain.ai_test_submissions);
    const attempted = submissions.filter((item) => item.status === "completed").length;
    const missed = submissions.filter((item) => item.status === "missed").length;
    const pending = submissions.length - attempted - missed;
    const scored = submissions.filter((item) => item.percentage !== null && item.percentage !== undefined);
    const average = scored.length
      ? Number((scored.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / scored.length).toFixed(2))
      : 0;

    return {
      ...plain,
      summary: {
        total_students: submissions.length,
        attempted,
        missed,
        pending,
        class_average_percentage: average,
      },
    };
  });
}

export async function getTeacherAssignmentDetail({ user, assignmentId }) {
  const assignment = await loadTeacherAssignmentScope({ user, assignmentId });
  const plain = toPlain(assignment);
  const submissions = toArray(plain.ai_test_submissions);
  const resultRows = submissions.map((submission) =>
    buildUnifiedResult({
      assignment: plain,
      submission,
      student: submission.student || submission.Student,
      role: "teacher",
    })
  );

  const attemptedRows = resultRows.filter((item) => item.attempt_status === "completed");
  const classAverage = attemptedRows.length
    ? Number((attemptedRows.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / attemptedRows.length).toFixed(2))
    : 0;

  const weakTopicCount = new Map();
  resultRows.forEach((row) => {
    toArray(row.weak_topics).forEach((topic) => {
      const key = String(topic || "").trim();
      if (!key) return;
      weakTopicCount.set(key, (weakTopicCount.get(key) || 0) + 1);
    });
  });

  return {
    ...plain,
    result_rows: resultRows,
    summary: {
      total_students: resultRows.length,
      attempted: resultRows.filter((row) => row.attempt_status === "completed").length,
      missed: resultRows.filter((row) => row.attempt_status === "missed").length,
      pending: resultRows.filter((row) => row.attempt_status === "pending").length,
      in_progress: resultRows.filter((row) => row.attempt_status === "in_progress").length,
      class_average_percentage: classAverage,
      weak_topics_across_class: Array.from(weakTopicCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count })),
    },
  };
}

export async function reviewStudentSubmission({ user, assignmentId, submissionId, payload }) {
  const assignment = await loadTeacherAssignmentScope({ user, assignmentId });
  const submission = await AITestSubmission.findOne({
    where: {
      id: submissionId,
      assignment_id: assignment.id,
      school_id: user.school_id,
    },
    include: [
      {
        model: Student,
        attributes: ["id", "roll_no", "admission_no", "class_id", "section_id"],
        include: [{ model: User, attributes: ["id", "name", "username"] }],
      },
    ],
  });

  if (!submission) throw new AppError("Submission not found", 404);

  const maxScore = Number(assignment.max_score || 0);
  const score = clampNumber(payload.score, 0, maxScore || Number(payload.score || 0));
  const percentage = maxScore ? Number(((score / maxScore) * 100).toFixed(2)) : 0;

  await submission.update({
    score,
    percentage,
    correct_answers: payload.correct_answers ?? submission.correct_answers ?? 0,
    wrong_answers: payload.wrong_answers ?? submission.wrong_answers ?? 0,
    strong_topics: toArray(payload.strong_topics),
    weak_topics: toArray(payload.weak_topics),
    feedback: payload.feedback || "",
    evaluation_source: "teacher",
    teacher_reviewed_at: getNow(),
    result_published_at: payload.publish_result === false ? submission.result_published_at : getNow(),
    status: submission.status === "pending" ? "completed" : submission.status,
  });

  return buildUnifiedResult({
    assignment: toPlain(assignment),
    submission: toPlain(submission),
    student: toPlain(submission.student || submission.Student),
    role: "teacher",
  });
}

export async function listStudentAssignments({ user }) {
  const rows = await AITestSubmission.findAll({
    where: {
      school_id: user.school_id,
      student_id: user.student_id,
    },
    include: [
      {
        model: AITestAssignment,
        where: { is_active: true },
        include: [
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
          { model: Subject, attributes: ["id", "name"] },
        ],
      },
      {
        model: Student,
        attributes: ["id", "roll_no", "admission_no"],
        include: [{ model: User, attributes: ["id", "name", "username"] }],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const items = [];
  for (const row of rows) {
    const assignment = row.ai_test_assignment;
    await refreshSubmissionState(row, assignment);
    items.push(
      buildUnifiedResult({
        assignment: toPlain(assignment),
        submission: toPlain(row),
        student: toPlain(row.student || row.Student),
        role: "student",
      })
    );
  }

  return items;
}

export async function getStudentAssignmentDetail({ user, assignmentId }) {
  const submission = await AITestSubmission.findOne({
    where: {
      school_id: user.school_id,
      student_id: user.student_id,
      assignment_id: assignmentId,
    },
    include: [
      {
        model: AITestAssignment,
        where: { is_active: true },
        include: [
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
          { model: Subject, attributes: ["id", "name"] },
        ],
      },
      {
        model: Student,
        attributes: ["id", "roll_no", "admission_no"],
        include: [{ model: User, attributes: ["id", "name", "username"] }],
      },
    ],
  });

  if (!submission) throw new AppError("Assigned test not found", 404);

  await refreshSubmissionState(submission, submission.ai_test_assignment);

  const assignmentPlain = toPlain(submission.ai_test_assignment);
  const submissionPlain = toPlain(submission);
  const studentPlain = toPlain(submission.student || submission.Student);

  return {
    assignment: assignmentPlain,
    submission: submissionPlain,
    questions: getAssignmentQuestionList(assignmentPlain.generated_content).map((question, index) => ({
      id: index + 1,
      prompt: question,
      answer: toArray(submissionPlain.answers).find((item) => Number(item?.id) === index + 1)?.answer || "",
    })),
    book_answers: getTeacherReferencePoints(assignmentPlain.generated_content),
    result: buildUnifiedResult({
      assignment: assignmentPlain,
      submission: submissionPlain,
      student: studentPlain,
      role: "student",
    }),
  };
}

export async function startStudentAssignment({ user, assignmentId }) {
  const detail = await getStudentAssignmentDetail({ user, assignmentId });
  const submission = await AITestSubmission.findByPk(detail.submission.id);

  if (detail.result.attempt_status === "missed") throw new AppError("This test is no longer active", 400);
  if (submission.status === "completed" && !detail.assignment.allow_retry) {
    throw new AppError("Retry is not allowed for this test", 400);
  }

  await submission.update({
    status: "in_progress",
    started_at: getNow(),
    submitted_at: null,
    result_published_at: detail.assignment.allow_retry && submission.status === "completed" ? null : submission.result_published_at,
    attempt_count: Number(submission.attempt_count || 0) + 1,
    ...(detail.assignment.allow_retry
      ? {
          score: null,
          percentage: null,
          correct_answers: null,
          wrong_answers: null,
          strong_topics: [],
          weak_topics: [],
          feedback: "",
          evaluation_source: "pending",
        }
      : {}),
  });

  return getStudentAssignmentDetail({ user, assignmentId });
}

export async function submitStudentAssignment({ user, assignmentId, answers, autoSubmit = false }) {
  const detail = await getStudentAssignmentDetail({ user, assignmentId });
  const assignment = detail.assignment;
  const submission = await AITestSubmission.findByPk(detail.submission.id);
  const now = getNow();
  const startedAt = submission.started_at ? new Date(submission.started_at) : now;
  const timeTakenSeconds = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 1000));
  const questions = detail.questions || [];
  const answerMap = new Map(
    toArray(answers).map((item) => [Number(item?.id), String(item?.answer || "").trim()])
  );
  const normalizedAnswers = questions.map((question) => ({
    id: Number(question.id),
    answer: answerMap.get(Number(question.id)) || "",
  }));
  const missingQuestions = questions.filter((question) => !answerMap.get(Number(question.id)));

  if (detail.result.attempt_status === "missed") throw new AppError("This test has expired", 400);
  if (!autoSubmit && missingQuestions.length) {
    throw new AppError(
      `All questions are required before submitting. Missing: ${missingQuestions.map((item) => `Q${item.id}`).join(", ")}`,
      400
    );
  }

  const evaluation = await evaluateSubmissionWithAI({ assignment, answers: normalizedAnswers });

  await submission.update({
    status: "completed",
    started_at: submission.started_at || now,
    submitted_at: now,
    time_taken_seconds: timeTakenSeconds,
    answers: normalizedAnswers,
    score: evaluation.score,
    percentage: evaluation.percentage,
    correct_answers: evaluation.correct_answers,
    wrong_answers: evaluation.wrong_answers,
    strong_topics: evaluation.strong_topics,
    weak_topics: evaluation.weak_topics,
    feedback: evaluation.feedback,
    evaluation_source: evaluation.evaluation_source,
    result_published_at: assignment.result_visibility === "immediate" ? now : submission.result_published_at,
  });

  return getStudentAssignmentDetail({ user, assignmentId });
}

export async function getStudentLockStatus({ user }) {
  const rows = await AITestSubmission.findAll({
    where: {
      school_id: user.school_id,
      student_id: user.student_id,
      status: { [Op.in]: ["pending", "in_progress"] },
    },
    include: [
      {
        model: AITestAssignment,
        where: {
          is_active: true,
          lock_mode: true,
          status: "assigned",
        },
      },
    ],
    order: [["created_at", "DESC"]],
  });

  for (const row of rows) {
    await refreshSubmissionState(row, row.ai_test_assignment);
  }

  const active = rows.find((row) => {
    const status = calculateAttemptStatus(row.ai_test_assignment, row);
    return status === "pending" || status === "in_progress";
  });

  if (!active) return { locked: false, assignment: null };

  return {
    locked: true,
    assignment: {
      id: active.assignment_id,
      title: active.ai_test_assignment.title,
      status: calculateAttemptStatus(active.ai_test_assignment, active),
      start_time: active.ai_test_assignment.start_time,
      end_time: active.ai_test_assignment.end_time,
      duration_minutes: active.ai_test_assignment.duration_minutes,
    },
  };
}

export async function listParentAssignmentResults({ user, student_id = null }) {
  const links = await listApprovedParentLinks({
    parent_user_id: user.id,
    school_id: user.school_id,
  });

  let studentIds = [...new Set(links.map((item) => Number(item.student_id)).filter(Number.isFinite))];
  if (student_id) {
    studentIds = studentIds.filter((id) => Number(id) === Number(student_id));
  }
  if (!studentIds.length) return [];

  const rows = await AITestSubmission.findAll({
    where: {
      school_id: user.school_id,
      student_id: studentIds,
    },
    include: [
      {
        model: AITestAssignment,
        where: { is_active: true },
        include: [
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
          { model: Subject, attributes: ["id", "name"] },
        ],
      },
      {
        model: Student,
        attributes: ["id", "roll_no", "admission_no"],
        include: [{ model: User, attributes: ["id", "name", "username"] }],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const items = [];
  for (const row of rows) {
    await refreshSubmissionState(row, row.ai_test_assignment);
    items.push(
      buildUnifiedResult({
        assignment: toPlain(row.ai_test_assignment),
        submission: toPlain(row),
        student: toPlain(row.student || row.Student),
        role: "parent",
      })
    );
  }

  return items;
}

