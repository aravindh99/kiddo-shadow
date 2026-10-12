import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { AutoGraph, Psychology, Quiz, School, Timer } from "@mui/icons-material";
import { useAuth } from "../../auth/AuthProvider";
import { getStudentAssignedTests } from "../ai-tests/aiTests.api";
import { HOBBY_CATEGORIES, HOBBY_SELECTION_STORAGE_KEY } from "../learning-analytics/hobbies.data";
import { getQuizHistory } from "../quiz/api/quiz.api";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "around", "basic", "chapter", "class", "concept", "concepts", "could",
  "create", "daily", "does", "exam", "explain", "for", "from", "game", "give", "help", "history",
  "how", "idea", "ideas", "improve", "into", "learn", "lesson", "make", "marks", "math", "more",
  "need", "notes", "paper", "please", "practice", "question", "questions", "quiz", "revise",
  "science", "session", "show", "single", "solve", "student", "study", "subject", "tell", "test",
  "the", "their", "them", "these", "this", "topic", "understand", "what", "when", "where", "which",
  "why", "with", "your",
]);

function titleCase(value = "") {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isUploadLikeLabel(value = "") {
  const text = String(value || "").trim();
  if (!text) return true;

  if (/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(text)) return true;
  if (/^\d{8,}$/.test(text)) return true;
  if (/^\d{8,}\s*(jpg|jpeg|png|webp|gif|bmp|svg)?$/i.test(text)) return true;
  if (/^[\d_-]+\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(text)) return true;

  return false;
}

function cleanLabel(value = "", fallback = "") {
  const text = String(value || "").trim();
  if (!text || isUploadLikeLabel(text)) return fallback;

  const cleaned = titleCase(text.replace(/[_-]+/g, " ").replace(/\s+/g, " "));
  return isUploadLikeLabel(cleaned) ? fallback : cleaned;
}

function normalizeTopic(value = "", fallback = "") {
  const cleaned = String(value || "")
    .replace(/\s*quiz$/i, "")
    .replace(/\s*test$/i, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (isUploadLikeLabel(cleaned)) return fallback;
  return cleanLabel(cleaned, fallback);
}

function extractKeywords(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
}

function historyKeyForUser(userId, classLevel) {
  return `ai_chat_conversations_${userId || "guest"}_${classLevel || "general"}`;
}

function getStoredChatConversations(userId, classLevel) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(historyKeyForUser(userId, classLevel));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSelectedHobbyTitles() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(HOBBY_SELECTION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return HOBBY_CATEGORIES.filter((category) => parsed.includes(category.id)).map((category) => category.title);
  } catch {
    return [];
  }
}

function takeTopLabels(map, count = 3, filterFn = null) {
  return [...map.entries()]
    .filter(([, value]) => !filterFn || filterFn(value))
    .sort((a, b) => b[1].score - a[1].score || b[1].count - a[1].count)
    .slice(0, count)
    .map(([label]) => label);
}

function buildInsights({ tests = [], quizzes = [], chats = [], hobbies = [] }) {
  const completedTests = tests.filter((item) => item?.attempt_status === "completed");
  const quizItems = Array.isArray(quizzes) ? quizzes : [];
  const chatItems = Array.isArray(chats) ? chats : [];

  const subjectMap = new Map();
  const strongTopicMap = new Map();
  const focusTopicMap = new Map();
  const interestMap = new Map();

  let totalStudyMinutes = 0;
  let totalSignals = 0;

  const addSubjectScore = (subject, score) => {
    const label = cleanLabel(subject, "General");
    const current = subjectMap.get(label) || { total: 0, count: 0, score: 0 };
    current.total += Number(score || 0);
    current.count += 1;
    current.score = current.total / current.count;
    subjectMap.set(label, current);
  };

  const addTopicSignal = (map, topic, weight, meta = {}) => {
    const label = normalizeTopic(topic);
    if (!label) return;
    if (isUploadLikeLabel(label)) return;
    const current = map.get(label) || { score: 0, count: 0, ...meta };
    current.score += Number(weight || 0);
    current.count += 1;
    if (meta.subject && !current.subject) current.subject = meta.subject;
    map.set(label, current);
  };

  const addInterest = (label, weight = 1) => {
    const nextLabel = cleanLabel(label);
    if (!nextLabel) return;
    if (isUploadLikeLabel(nextLabel)) return;
    const current = interestMap.get(nextLabel) || { score: 0, count: 0 };
    current.score += Number(weight || 0);
    current.count += 1;
    interestMap.set(nextLabel, current);
  };

  completedTests.forEach((item) => {
    const percentage = Number(item?.percentage || 0);
    const subject = item?.subject || item?.subject_name || "General";
    const topic = item?.chapter_name || item?.topic || item?.title || subject;

    addSubjectScore(subject, percentage);
    totalSignals += 1;
    totalStudyMinutes += 35;

    if (percentage >= 75) {
      addTopicSignal(strongTopicMap, topic, percentage, { subject: cleanLabel(subject, "General") });
    } else if (percentage <= 55) {
      addTopicSignal(focusTopicMap, topic, 100 - percentage, { subject: cleanLabel(subject, "General") });
    } else {
      addInterest(topic, 1);
    }
  });

  quizItems.forEach((item) => {
    const rawTitle = item?.quiz?.title || item?.quiz?.topic || item?.quiz?.name || item?.mode || "Quiz";
    const topic = normalizeTopic(rawTitle, "Quiz Practice");
    const score = Number(item?.my_score || 0);
    totalSignals += 1;
    totalStudyMinutes += item?.mode === "MULTI" ? 12 : 8;

    if (score >= 8) {
      addTopicSignal(strongTopicMap, topic, score);
    } else if (score > 0 && score <= 4) {
      addTopicSignal(focusTopicMap, topic, 6 - score);
    } else {
      addInterest(topic, 1);
    }
  });

  chatItems.forEach((conversation) => {
    const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
    const userMessages = messages.filter((message) => message?.role === "user");
    if (!userMessages.length) return;

    totalSignals += 1;
    totalStudyMinutes += Math.max(5, userMessages.length * 4);

    const title = normalizeTopic(conversation?.title || "");
    if (title) addInterest(title, 2);

    userMessages.forEach((message) => {
      const text = String(message?.text || "");
      extractKeywords(text).forEach((keyword) => addInterest(keyword, 1));
      if (text.length > 0 && text.length < 90) {
        addInterest(text, 0.5);
      }
    });
  });

  hobbies.forEach((hobbyTitle) => {
    addInterest(hobbyTitle, 3);
  });

  const subjectAverages = [...subjectMap.entries()].map(([subject, value]) => ({
    subject,
    average: value.count ? value.total / value.count : 0,
    count: value.count,
  }));
  const sortedSubjects = [...subjectAverages].sort((a, b) => b.average - a.average || b.count - a.count);
  const strongSubjects = sortedSubjects.filter((item) => item.average >= 70).slice(0, 3).map((item) => item.subject);
  const weakSubjects = [...sortedSubjects].reverse().filter((item) => item.average <= 60).slice(0, 3).map((item) => item.subject);
  const topSubject = sortedSubjects[0]?.subject || "N/A";

  const strongTopics = takeTopLabels(strongTopicMap, 4);
  const focusTopics = takeTopLabels(focusTopicMap, 4);
  const extraInterests = takeTopLabels(
    interestMap,
    6,
    (value) => value.score >= 2
  ).filter((label) => !strongTopics.includes(label) && !focusTopics.includes(label));

  const recommended_focus = [...focusTopicMap.entries()]
    .sort((a, b) => b[1].score - a[1].score || b[1].count - a[1].count)
    .slice(0, 4)
    .map(([topic, value]) => ({
      subject: value.subject || weakSubjects[0] || topSubject || "General",
      topic,
      engagement_minutes: Math.max(15, Math.round(value.score * 4)),
    }));

  const averageTestPercentage = completedTests.length
    ? Math.round(completedTests.reduce((sum, item) => sum + Number(item?.percentage || 0), 0) / completedTests.length)
    : 0;

  const recommendationText = recommended_focus.length
    ? `Keep your momentum in ${topSubject}. Spend extra time on ${recommended_focus
        .slice(0, 2)
        .map((item) => item.topic)
        .join(" and ")} based on your latest tests, quizzes, and chat questions.`
    : hobbies.length
      ? `You have active interest in ${hobbies.join(", ")}. Continue practicing regularly to build stronger academic patterns.`
      : "Use quizzes, assigned tests, AI chat, and hobbies regularly to unlock more personalized study guidance.";

  return {
    strong_subjects: strongSubjects,
    weak_subjects: weakSubjects,
    strong_topics: strongTopics,
    focus_topics: focusTopics,
    extra_interests: extraInterests.concat(hobbies.filter((item) => !extraInterests.includes(item))).slice(0, 6),
    recommended_focus: recommended_focus,
    top_subject: topSubject,
    recommendations: recommendationText,
    total_minutes: totalStudyMinutes,
    signal_count: totalSignals + hobbies.length,
    average_test_percentage: averageTestPercentage,
    completed_test_count: completedTests.length,
    completed_quiz_count: quizItems.length,
    chat_count: chatItems.length,
    hobby_count: hobbies.length,
  };
}

export default function PersonalizedInsightsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceData, setSourceData] = useState({
    tests: [],
    quizzes: [],
    chats: [],
    hobbies: [],
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [testsRes, quizzesRes] = await Promise.all([
          getStudentAssignedTests().catch(() => ({ data: { items: [] } })),
          getQuizHistory({ limit: 20 }).catch(() => ({ data: { items: [] } })),
        ]);

        if (!active) return;

        setSourceData({
          tests: Array.isArray(testsRes?.data?.items) ? testsRes.data.items : [],
          quizzes: Array.isArray(quizzesRes?.data?.items) ? quizzesRes.data.items : [],
          chats: getStoredChatConversations(user?.id, user?.class_level),
          hobbies: getSelectedHobbyTitles(),
        });
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Could not load personalized insights.");
        setSourceData({
          tests: [],
          quizzes: [],
          chats: getStoredChatConversations(user?.id, user?.class_level),
          hobbies: getSelectedHobbyTitles(),
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.class_level, user?.id]);

  const insights = useMemo(() => buildInsights(sourceData), [sourceData]);
  const strongSubjects = insights.strong_subjects || [];
  const weakSubjects = insights.weak_subjects || [];
  const strongTopics = insights.strong_topics || [];
  const focusTopics = insights.focus_topics || [];
  const extraInterests = insights.extra_interests || [];
  const recommendations = insights.recommended_focus || [];
  const topSubject = insights.top_subject || "N/A";
  const totalMinutes = Number(insights.total_minutes || 0);
  const signalCount = Number(insights.signal_count || 0);
  const hasAnyData =
    sourceData.tests.length > 0 ||
    sourceData.quizzes.length > 0 ||
    sourceData.chats.length > 0 ||
    sourceData.hobbies.length > 0;

  return (
    <Container maxWidth="md" sx={{ mt: 3, pb: 10 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Avatar sx={{ bgcolor: "secondary.main" }}>
          <Psychology />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Personalized
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real insights from your tests, quizzes, AI chats, and hobby choices.
          </Typography>
        </Box>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!loading && !hasAnyData ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No personalized activity yet. Complete a test, attempt quizzes, ask questions in AI chat, or choose hobbies to generate your learning profile.
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Stack spacing={0.8}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Timer fontSize="small" color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Learning Time
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {`${(totalMinutes / 60).toFixed(1)} hrs`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estimated from study actions completed in the app.
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Stack spacing={0.8}>
              <Stack direction="row" spacing={1} alignItems="center">
                <School fontSize="small" color="secondary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Top Subject
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {topSubject}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based mainly on corrected assigned test performance.
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Stack spacing={0.8}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoGraph fontSize="small" color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Signals Tracked
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {signalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`${insights.completed_test_count} tests, ${insights.completed_quiz_count} quizzes, ${insights.chat_count} chats, ${insights.hobby_count} hobbies`}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Academic Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Strong and weak subjects calculated from your completed test scores.
          </Typography>

          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Strong Subjects
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {strongSubjects.length ? (
                  strongSubjects.map((subject) => (
                    <Chip key={`strong-${subject}`} label={subject} color="success" variant="outlined" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Complete more tests to identify strong subjects.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Weak Subjects
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {weakSubjects.length ? (
                  weakSubjects.map((subject) => (
                    <Chip key={`weak-${subject}`} label={subject} color="warning" variant="outlined" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No weak subject pattern detected yet.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                Recommended Focus
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Calculated from low-scoring tests and weaker quiz patterns.
              </Typography>
              <List dense sx={{ py: 0 }}>
                {recommendations.length ? (
                  recommendations.map((item) => (
                    <ListItem key={`${item.subject}-${item.topic}`} sx={{ px: 0 }}>
                      <ListItemText
                        primary={`${item.subject}: ${item.topic}`}
                        secondary={`${item.engagement_minutes || 0} mins recommended focus time`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    More completed attempts are needed before focus recommendations can be generated.
                  </Typography>
                )}
              </List>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Strong Topics
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {strongTopics.length ? (
                  strongTopics.map((topic) => <Chip key={`topic-strong-${topic}`} label={topic} color="success" size="small" variant="outlined" />)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Strong topics will appear here after more activity.
                  </Typography>
                )}
              </Stack>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Focus Topics
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {focusTopics.length ? (
                  focusTopics.map((topic) => <Chip key={`topic-focus-${topic}`} label={topic} color="warning" size="small" variant="outlined" />)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No weak topic trend detected yet.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                Interests From Activity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Built from quiz titles, AI chat questions, and saved hobbies.
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {extraInterests.length > 0 ? (
                  extraInterests.map((item) => (
                    <Chip
                      key={`extra-${item}`}
                      label={item}
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Ask more AI questions or choose hobbies to reveal interests here.
                  </Typography>
                )}
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Quiz fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700}>
                  Study Suggestion
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {insights.recommendations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
