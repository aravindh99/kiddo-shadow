import { Op, fn, col } from "sequelize";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import User from "../users/user.model.js";
import Student from "../students/student.model.js";
import Class from "../classes/classes.model.js";
import AITestSubmission from "../ai-test-assignments/ai-test-submission.model.js";
import AITestAssignment from "../ai-test-assignments/ai-test-assignment.model.js";

function uniqueList(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function cleanTopic(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function topEntries(map, limit = 5, direction = "desc") {
  return [...map.entries()]
    .sort((a, b) => (direction === "desc" ? b[1] - a[1] : a[1] - b[1]))
    .slice(0, limit);
}

function extractExtraInterests(logs = [], completedTests = []) {
  const interests = [];

  logs.forEach((item) => {
    const aiType = titleCase(item?.ai_type || "");
    if (aiType) interests.push(aiType);
  });

  completedTests.forEach((item) => {
    const subject = titleCase(item?.ai_test_assignment?.subject_name || "");
    const chapter = titleCase(item?.ai_test_assignment?.chapter_name || "");
    if (subject) interests.push(subject);
    if (chapter) interests.push(chapter);
  });

  return uniqueList(interests).slice(0, 6);
}

export async function getStudentPersonalizedInsights({ studentUserId, studentId, schoolId }) {
  const [logs, submissions] = await Promise.all([
    AiChatLog.findAll({
      where: { user_id: studentUserId },
      attributes: ["ai_type", "user_query", "created_at"],
      order: [["created_at", "DESC"]],
      limit: 50,
      raw: true,
    }),
    AITestSubmission.findAll({
      where: {
        student_id: studentId,
        school_id: schoolId,
      },
      include: [
        {
          model: AITestAssignment,
          attributes: ["id", "title", "subject_name", "chapter_name", "is_active"],
          where: { is_active: true },
        },
      ],
      order: [["updated_at", "DESC"]],
    }),
  ]);

  const completedTests = submissions.filter(
    (item) => item.status === "completed" && item.percentage !== null && item.percentage !== undefined
  );

  const subjectBuckets = new Map();
  const strongTopicCounts = new Map();
  const weakTopicCounts = new Map();

  completedTests.forEach((item) => {
    const subject = cleanTopic(item?.ai_test_assignment?.subject_name || "General");
    const percentage = Number(item?.percentage || 0);
    const current = subjectBuckets.get(subject) || { total: 0, count: 0 };
    current.total += percentage;
    current.count += 1;
    subjectBuckets.set(subject, current);

    (Array.isArray(item?.strong_topics) ? item.strong_topics : []).forEach((topic) => {
      const key = titleCase(cleanTopic(topic));
      if (key) strongTopicCounts.set(key, (strongTopicCounts.get(key) || 0) + 1);
    });

    (Array.isArray(item?.weak_topics) ? item.weak_topics : []).forEach((topic) => {
      const key = titleCase(cleanTopic(topic));
      if (key) weakTopicCounts.set(key, (weakTopicCounts.get(key) || 0) + 1);
    });
  });

  const subjectAverages = [...subjectBuckets.entries()].map(([subject, value]) => ({
    subject: titleCase(subject),
    average: value.count ? Number((value.total / value.count).toFixed(2)) : 0,
  }));
  const sortedSubjects = [...subjectAverages].sort((a, b) => b.average - a.average);
  const strongSubjects = sortedSubjects.slice(0, 3).map((item) => item.subject);
  const weakSubjects = [...sortedSubjects].reverse().slice(0, 3).map((item) => item.subject);
  const strongTopics = topEntries(strongTopicCounts, 5).map(([topic]) => topic);
  const focusTopics = topEntries(weakTopicCounts, 5).map(([topic]) => topic);
  const topSubject = sortedSubjects[0]?.subject || "N/A";
  const extraInterests = extractExtraInterests(logs, completedTests);

  const recommended_focus = (focusTopics.length ? focusTopics : weakSubjects).slice(0, 4).map((topic, index) => ({
    subject: weakSubjects[index] || weakSubjects[0] || topSubject || "General",
    topic,
    engagement_minutes: 30 + index * 10,
  }));

  const recommendations = completedTests.length
    ? `Top strength: ${topSubject}. Focus next on ${focusTopics.slice(0, 2).join(" and ") || weakSubjects.slice(0, 2).join(" and ") || "consistent revision"} to improve test performance.`
    : "Complete assigned AI tests to unlock personalized academic insights and recommendations.";

  return {
    strong_subjects: strongSubjects,
    weak_subjects: weakSubjects,
    strong_topics: strongTopics,
    focus_topics: focusTopics,
    extra_interests: extraInterests,
    recommended_focus,
    top_subject: topSubject,
    recommendations,
    ai_test_summary: {
      total_attempted: completedTests.length,
      average_percentage: completedTests.length
        ? Number(
            (
              completedTests.reduce((sum, item) => sum + Number(item?.percentage || 0), 0) / completedTests.length
            ).toFixed(2)
          )
        : 0,
    },
  };
}

/* ===================== SCHOOL ===================== */

export async function getSchoolAnalytics(schoolId) {
  return AiChatLog.findAll({
    attributes: [
      [fn("COUNT", col("ai_chat_log.id")), "total_calls"],
      [fn("SUM", col("tokens_used")), "total_tokens"],
      [col("user.role"), "role"],
    ],
    include: [
      {
        model: User,
        attributes: [],
        where: { school_id: schoolId },
      },
    ],
    group: ["user.role"],
    raw: true,
  });
}

export async function getSchoolUserUsage(schoolId, role = "student") {
  return AiChatLog.findAll({
    attributes: [
      "user_id",
      [fn("COUNT", col("ai_chat_log.id")), "total_calls"],
      [fn("SUM", col("tokens_used")), "total_tokens"],
    ],
    include: [
      {
        model: User,
        attributes: ["id", "name", "username", "role", "school_id"],
        where: { school_id: schoolId, role },
      },
    ],
    group: ["ai_chat_log.user_id", "user.id"],
    order: [[fn("SUM", col("tokens_used")), "DESC"]],
    raw: true,
  });
}

export async function getSchoolClassUsage(schoolId) {
  const rows = await AiChatLog.findAll({
    attributes: [
      [col("user->student.class_id"), "class_id"],
      [fn("COUNT", col("ai_chat_log.id")), "total_calls"],
      [fn("SUM", col("tokens_used")), "total_tokens"],
    ],
    include: [
      {
        model: User,
        attributes: [],
        where: { school_id: schoolId, role: "student" },
        include: [
          {
            model: Student,
            attributes: [],
            include: [{ model: Class, attributes: ["id", "class_name"] }],
          },
        ],
      },
    ],
    group: ["user->student.class_id", "user->student->class.id"],
    order: [[fn("SUM", col("tokens_used")), "DESC"]],
    raw: true,
  });

  const classIds = rows
    .map((r) => r.class_id)
    .filter((v) => v !== null && v !== undefined);

  const classes = await Class.findAll({
    where: { id: classIds },
    attributes: ["id", "class_name"],
  });

  const classMap = new Map(classes.map((c) => [String(c.id), c.class_name]));

  return rows.map((r) => ({
    ...r,
    class_name: classMap.get(String(r.class_id)) || null,
  }));
}

/* ===================== TEACHER ===================== */

export async function getTeacherAnalytics(teacherUserId) {
  return AiChatLog.findAll({
    attributes: [
      "ai_type",
      [fn("COUNT", col("id")), "calls"],
      [fn("SUM", col("tokens_used")), "tokens"],
    ],
    where: { user_id: teacherUserId },
    group: ["ai_type"],
    order: [[fn("SUM", col("tokens_used")), "DESC"]],
    raw: true,
  });
}

/* ===================== STUDENT ===================== */

export async function getStudentDailyUsage(studentUserId) {
  return AiChatLog.findAll({
    attributes: [
      [fn("DATE", col("created_at")), "date"],
      [fn("SUM", col("tokens_used")), "tokens"],
    ],
    where: { user_id: studentUserId },
    group: [fn("DATE", col("created_at"))],
    order: [[fn("DATE", col("created_at")), "ASC"]],
    raw: true,
  });
}
