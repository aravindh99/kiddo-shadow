import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Container,
  Button,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Paper,
  LinearProgress,
  Stack
} from "@mui/material";
import { School } from "@mui/icons-material";
import { generateQuestionBankQuiz, generateQuiz, startSingleQuiz, submitSingleQuiz } from "../api/quiz.api";
import QuestionCard from "../components/QuestionCard";
import { useAuth } from "../../../auth/AuthProvider";
import { getErrorMessage } from "../../../utils/apiErrorHandler";

export default function SinglePlayerQuizPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const autoStartedRef = useRef(false);
  const questionBankConfig = location.state?.questionBankConfig || null;
  const prefilledTopic = String(location.state?.prefilledTopic || "").trim();
  const isAcademicDomainsFlow = questionBankConfig?.source === "academic-domains";
  const [gameState, setGameState] = useState("setup"); // setup, loading, playing
  const [topic, setTopic] = useState(
    questionBankConfig?.exam ? `${questionBankConfig.exam} Practice` : prefilledTopic
  );
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizMeta, setQuizMeta] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup Phase: Start Quiz
  async function handleStart() {
    const normalizedTopic = String(topic || "").trim();
    if (!questionBankConfig?.exam && !normalizedTopic) return;

    setErrorMessage("");
    setGameState("loading");
    try {
      const res = questionBankConfig?.exam
        ? await generateQuestionBankQuiz({
              exam: questionBankConfig.exam,
              numQuestions: questionBankConfig.numQuestions || 10,
              totalMarks: questionBankConfig.totalMarks,
              aiMode: questionBankConfig.aiMode,
              subject: questionBankConfig.subject,
            })
        : await generateQuiz({
            topic: normalizedTopic,
            classLevel: user?.class_level || 5,
            difficulty: "MEDIUM",
            numQuestions: 5,
          });

      const quizData = res.data?.questions || [];

      if (quizData.length > 0) {
        const startRes = await startSingleQuiz({
          quizId: res.data?.quizId,
          timeLimitMinutes: questionBankConfig?.timeLimitMinutes || 5,
        });
        setSessionId(startRes.data?.sessionId || null);
        setPlayerId(startRes.data?.playerId || null);
        setQuestions(quizData);
        setQuizMeta({
          exam: questionBankConfig?.exam || res.data?.exam || null,
          totalMarks: questionBankConfig?.totalMarks || res.data?.totalMarks || null,
          marksPerQuestion: questionBankConfig?.marksPerQuestion || res.data?.marksPerQuestion || null,
          source: questionBankConfig?.source || location.state?.source || null,
        });
        setAnswers([]);
        setCurrentIndex(0);
        setGameState("playing");
        setSelectedIndex(null);
      } else {
        setErrorMessage("Gemini did not return a playable quiz. Please try a clearer topic.");
        setGameState("setup");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(getErrorMessage(err) || "Failed to start quiz.");
      setGameState("setup");
    }
  }

  async function handleSelectAnswer(answerIndex) {
    if (answerIndex === null || answerIndex === undefined || isSubmitting || selectedIndex !== null) return;
    setErrorMessage("");
    setIsSubmitting(true);
    const currentQ = questions[currentIndex];

    if (!currentQ?.id) {
      setErrorMessage("This question could not be submitted. Please restart the quiz.");
      setGameState("setup");
      setIsSubmitting(false);
      return;
    }

    setSelectedIndex(answerIndex);
    const nextAnswers = [
      ...answers,
      { questionId: currentQ.id, selectedIndex: answerIndex },
    ];
    setAnswers(nextAnswers);

    const isLastQuestion = currentIndex >= questions.length - 1;

    window.setTimeout(async () => {
      if (!isLastQuestion) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedIndex(null);
        setIsSubmitting(false);
        return;
      }

      try {
        let submitResult = null;
        if (playerId) {
          const submitRes = await submitSingleQuiz({
            playerId,
            answers: nextAnswers,
          });
          submitResult = submitRes?.data || null;
        }

        if (sessionId) {
          navigate(`/student/quiz/${sessionId}/results`, {
            state: {
              backTo: isAcademicDomainsFlow ? "/student/academic-domains" : "/student/quiz",
              backLabel: isAcademicDomainsFlow ? "Back to Academic Domains" : "Back to Quiz Menu",
              singleQuizReview: {
                ...submitResult,
                questionBank: submitResult?.questionBank || (quizMeta?.exam ? quizMeta : null),
                backTo: isAcademicDomainsFlow ? "/student/academic-domains" : "/student/quiz",
                backLabel: isAcademicDomainsFlow ? "Back to Academic Domains" : "Back to Quiz Menu",
              },
            },
          });
          return;
        }

        setGameState("setup");
        setIsSubmitting(false);
      } catch (err) {
        console.error(err);
        setErrorMessage(getErrorMessage(err) || "Failed to submit quiz.");
        setGameState("setup");
        setIsSubmitting(false);
      }
    }, 500);
  }

  useEffect(() => {
    if (!prefilledTopic) return;
    if (questionBankConfig?.exam) return;
    setTopic(prefilledTopic);
  }, [prefilledTopic, questionBankConfig?.exam]);

  useEffect(() => {
    if (gameState !== "setup") return;
    if (!location.state?.autoStart) return;
    if (!questionBankConfig?.exam && !prefilledTopic) return;
    if (autoStartedRef.current) return;

    autoStartedRef.current = true;
    handleStart();
  }, [gameState, location.state, prefilledTopic, questionBankConfig?.exam]);

  if (user?.role === "teacher") {
    return (
      <Container maxWidth="xs" sx={{ mt: 8, textAlign: "center" }}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Single Player is not available for teachers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a multiplayer quiz instead.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/teacher/quiz")}>
            Go to Multiplayer
          </Button>
        </Paper>
      </Container>
    );
  }

  // Render Setup
  if (gameState === "setup") {
    return (
      <Container maxWidth="xs" sx={{ mt: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <School sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {questionBankConfig?.exam ? `${questionBankConfig.exam} Question Paper` : "Quiz Practice"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {questionBankConfig?.exam
              ? `${questionBankConfig?.totalMarks || 0} marks paper with ${questionBankConfig?.marksPerQuestion || 1} mark(s) per question and ${questionBankConfig?.timeLimitMinutes || 10} minute(s).`
              : location.state?.source === "ai-chat"
              ? "A quiz topic was picked from your AI chat automatically."
              : "Enter a topic and start a quiz."}
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
              {errorMessage}
            </Alert>
          )}

          {!questionBankConfig?.exam && (
            <TextField
              label="Quiz Topic (e.g. Solar System)"
              fullWidth
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              helperText="Use a clear topic like Fractions, Human Digestive System, or Indian Freedom Movement."
              sx={{ mb: 3 }}
            />
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleStart}
            disabled={!questionBankConfig?.exam && !topic.trim()}
            sx={{ borderRadius: 2 }}
          >
            {questionBankConfig?.exam ? "Start Question Paper" : "Start Quiz"}
          </Button>
        </Paper>
      </Container>
    );
  }

  // Render Loading
  if (gameState === "loading") {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ mt: 3, fontWeight: 500 }}>Generating questions...</Typography>
      </Box>
    );
  }

  // Render Playing
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack spacing={2} sx={{ mb: 4 }}>
        <LinearProgress variant="determinate" value={((currentIndex + 1) / questions.length) * 100} sx={{ height: 10, borderRadius: 5 }} />
        <Typography align="right" variant="caption">
          Question {currentIndex + 1} of {questions.length}
        </Typography>
        {quizMeta?.exam && (
          <Typography align="right" variant="caption" color="text.secondary">
            {quizMeta.exam} - {quizMeta.totalMarks || 0} marks - {quizMeta.marksPerQuestion || 1} mark(s) each
          </Typography>
        )}
        {errorMessage && (
          <Alert severity="error">
            {errorMessage}
          </Alert>
        )}
      </Stack>

      <QuestionCard
        question={questions[currentIndex]}
        onAnswer={handleSelectAnswer}
        disabled={selectedIndex !== null || isSubmitting}
        selectedIndex={selectedIndex}
      />
    </Container>
  );
}
