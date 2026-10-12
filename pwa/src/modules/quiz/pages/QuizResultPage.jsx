import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { EmojiEvents } from "@mui/icons-material";
import { getQuizLeaderboard, getSingleQuizReview } from "../api/quiz.api";
import { useAuth } from "../../../auth/AuthProvider";

function getDisplayName(user, fallback = "You") {
  const name = String(user?.name || user?.displayName || "").trim();
  const admissionNo = String(user?.student?.admission_no || user?.Student?.admission_no || "").trim();
  const username = String(user?.username || "").trim();
  return name && name.toLowerCase() !== "student" ? name : admissionNo || username || fallback;
}

export default function QuizResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardMeta, setLeaderboardMeta] = useState(null);
  const [reviewData, setReviewData] = useState(location.state?.singleQuizReview || null);
  const [reviewLoading, setReviewLoading] = useState(!location.state?.singleQuizReview);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [leaderboardRes, reviewRes] = await Promise.allSettled([
          getQuizLeaderboard(id),
          getSingleQuizReview(id),
        ]);

        if (leaderboardRes.status === "fulfilled") {
          const payload = leaderboardRes.value.data || [];
          if (Array.isArray(payload)) {
            setLeaderboard(payload);
            setLeaderboardMeta(null);
          } else {
            setLeaderboard(Array.isArray(payload?.items) ? payload.items : []);
            setLeaderboardMeta(payload?.session || null);
          }
        }

        if (reviewRes.status === "fulfilled") {
          setReviewData((current) => ({
            ...(reviewRes.value.data || {}),
            questionBank: reviewRes.value.data?.questionBank || current?.questionBank || null,
            backTo: current?.backTo || location.state?.backTo || null,
            backLabel: current?.backLabel || location.state?.backLabel || null,
          }));
          setReviewError("");
        } else if (!location.state?.singleQuizReview) {
          setReviewError(reviewRes.reason?.response?.data?.message || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setReviewLoading(false);
      }
    }
    load();
  }, [id, location.state]);

  const myEntry =
    leaderboard.find((p) =>
      String(p.User?.id || p.userId || p.user_id || "") === String(user?.id || "")
    ) || null;
  const myScore = reviewData?.score ?? myEntry?.score ?? 0;
  const totalQuestions = reviewData?.total ?? reviewData?.review?.length ?? leaderboardMeta?.totalQuestions ?? 0;
  const marksPerQuestion = reviewData?.marksPerQuestion ?? leaderboardMeta?.marksPerQuestion ?? 1;
  const obtainedMarks = reviewData?.obtainedMarks ?? (myScore * marksPerQuestion);
  const totalMarks = reviewData?.totalMarks ?? leaderboardMeta?.totalMarks ?? (totalQuestions * marksPerQuestion);
  const percentage = totalQuestions ? Math.round((myScore / totalQuestions) * 100) : 0;
  const hasDetailedReview = Array.isArray(reviewData?.review) && reviewData.review.length > 0;
  const correctAnswers = hasDetailedReview
    ? reviewData.review.filter((item) => item.isCorrect).length
    : myEntry?.correctAnswers ?? myScore;
  const wrongAnswers = hasDetailedReview
    ? reviewData.review.filter((item) => !item.isCorrect).length
    : myEntry?.wrongAnswers ?? Math.max(0, Number(myEntry?.answeredCount || 0) - Number(correctAnswers || 0));
  const questionBank = reviewData?.questionBank || leaderboardMeta?.questionBank || null;

  const isTeacher = location.pathname.startsWith("/teacher");
  const isStudentDemo = location.pathname.startsWith("/students");
  const explicitBackPath = reviewData?.backTo || location.state?.backTo || null;
  const explicitBackLabel = reviewData?.backLabel || location.state?.backLabel || null;
  const isQuestionBankQuiz = Boolean(questionBank?.exam);
  const userDisplayName = getDisplayName(user, "You");
  const backPath = explicitBackPath || (isTeacher
    ? "/teacher/quiz"
    : isStudentDemo
    ? "/students/quiz"
    : isQuestionBankQuiz
    ? "/student/academic-domains"
    : "/student/quiz");

  return (
    <Box sx={{ p: 3, mt: 4, textAlign: 'center' }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <EmojiEvents sx={{ fontSize: 60, color: '#FFD700', mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Game Over!
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mt: 2, mb: 3 }}>
          <Avatar src={user?.avatar_url}>
            {userDisplayName[0] || "U"}
          </Avatar>
          <Box sx={{ textAlign: "left" }}>
            <Typography fontWeight="bold">{userDisplayName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Your score: {totalQuestions ? `${myScore} / ${totalQuestions}` : myScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Marks: {obtainedMarks} / {totalMarks}
            </Typography>
          </Box>
        </Stack>

        {(hasDetailedReview || totalQuestions > 0) && (
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3, flexWrap: "wrap" }}>
            <Chip color="primary" label={`${myScore} / ${totalQuestions}`} />
            <Chip color="secondary" label={`${obtainedMarks} / ${totalMarks} marks`} />
            <Chip color={percentage >= 60 ? "success" : "warning"} label={`${percentage}%`} />
            <Chip variant="outlined" label={reviewData?.topic || reviewData?.quizTitle || leaderboardMeta?.topic || leaderboardMeta?.quizTitle || "Quiz"} />
            {questionBank?.exam && (
              <Chip variant="outlined" color="info" label={`${questionBank.exam} - ${marksPerQuestion} mark(s)`} />
            )}
          </Stack>
        )}

        {reviewLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!reviewLoading && hasDetailedReview && (
          <Box sx={{ mt: 4, mb: 4, textAlign: "left" }}>
            <Typography variant="h6" gutterBottom>
              Answer Review
            </Typography>
            <Stack spacing={2}>
              {reviewData.review.map((item, index) => (
                <Paper
                  key={item.questionId || index}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    borderColor: item.isCorrect ? "success.light" : "error.light",
                    bgcolor: item.isCorrect ? "#f1f8f4" : "#fdf1f1",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Typography fontWeight={700}>
                      Q{index + 1}. {item.questionText}
                    </Typography>
                  </Stack>
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {item.options.map((option, optionIndex) => {
                      const isSelected = optionIndex === item.selectedOptionIndex;
                      const isCorrectOption = optionIndex === item.correctOptionIndex;

                      let bgcolor = "grey.100";
                      let color = "text.primary";
                      let borderColor = "grey.300";

                      if (isCorrectOption) {
                        bgcolor = "success.light";
                        color = "success.contrastText";
                        borderColor = "success.main";
                      } else if (isSelected && !item.isCorrect) {
                        bgcolor = "error.light";
                        color = "error.contrastText";
                        borderColor = "error.main";
                      }

                        return (
                          <Box
                            key={`${item.questionId}-${optionIndex}`}
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            border: 1,
                            borderColor,
                            bgcolor,
                            color,
                          }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" fontWeight={isSelected || isCorrectOption ? 700 : 500}>
                                {option}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {!reviewLoading && !hasDetailedReview && reviewError && (
          <Alert severity="info" sx={{ mt: 3, textAlign: "left" }}>
            {reviewError}
          </Alert>
        )}

        <Box sx={{ mt: 4, mb: 4, textAlign: 'left' }}>
          <Typography variant="h6" gutterBottom>Leaderboard</Typography>
          {!leaderboard.length ? (
            <Typography variant="body2" color="text.secondary">
              No leaderboard data available yet.
            </Typography>
          ) : (
            <List>
              {leaderboard.map((player, idx) => {
                const playerName = player.displayName || getDisplayName(player.User, "Player");
                const playerScore = Number(player.score || 0);
                const playerMarks = player.obtainedMarks ?? (playerScore * marksPerQuestion);
                const playerTotalMarks = player.totalMarks ?? totalMarks;
                return (
                <Box key={player.User?.id || player.user_id || idx}>
                  <ListItem
                    sx={{ alignItems: "center", py: 1.75 }}
                    secondaryAction={
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" fontWeight="bold">{playerScore} pts</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {playerMarks} / {playerTotalMarks} marks
                        </Typography>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'grey.300' }}>
                        {idx + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={playerName}
                      secondary={`Player ${idx + 1}`}
                    />
                  </ListItem>
                  {idx < leaderboard.length - 1 && <Divider component="li" />}
                </Box>
                );
              })}
            </List>
          )}
        </Box>

        <Button variant="contained" fullWidth onClick={() => navigate(backPath)}>
          {explicitBackLabel || (isQuestionBankQuiz ? "Back to Academic Domains" : "Back to Quiz Menu")}
        </Button>
      </Paper>
    </Box>
  );
}
