import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, LinearProgress, Stack, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../../auth/AuthProvider";
import { useLocation } from "react-router-dom";
import { useQuizPlay } from "../hooks/useQuizPlay";
import { connectQuizSocket } from "../socket/quiz.socket";
import QuestionCard from "../components/QuestionCard";

export default function QuizPlayPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { submitAnswer, answered } = useQuizPlay(id);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(30000); // 30s default
  const [waiting, setWaiting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    if (!id) return;
    const socket = connectQuizSocket(token);
    // Ensure this page joins the room so we get current question
    socket.emit("quiz:join", { sessionId: id });

    socket.on("quiz:question", (data) => {
      // data = { question, questionIndex, totalQuestions, timeLimit }
      setCurrentQuestion(data.question);
      setTimeLeft(data.timeLimit || 30000);
      setTotalTime(data.timeLimit || 30000);
      setWaiting(false);
      setSelectedIndex(null);
    });

    socket.on("quiz:time_up", () => {
      // Show feedback potentially?
    });

    socket.on("quiz:finished", () => {
      const isTeacher = location.pathname.startsWith("/teacher");
      const isStudentDemo = location.pathname.startsWith("/students");
      const base = isTeacher ? "/teacher" : isStudentDemo ? "/students" : "/student";
      navigate(`${base}/quiz/${id}/results`, { replace: true });
    });

    return () => {
      socket.off("quiz:question");
      socket.off("quiz:time_up");
      socket.off("quiz:finished");
    };
  }, [id, token, navigate]);

  // Timer text effect
  useEffect(() => {
    if (!currentQuestion) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion]);

  if (!id) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Invalid quiz link. Go back to Quiz.</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Waiting for game to start...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Check if we already answered this specific question ID
  const isAnswered = answered[currentQuestion.id] || waiting;

  return (
    <Box sx={{ p: 2, mt: 2 }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton
            size="small"
            onClick={() => {
              try {
                const socket = connectQuizSocket(token);
                socket.emit("quiz:finished", { sessionId: id });
              } catch {
                // ignore
              }
              navigate(-1);
            }}
            aria-label="Quit quiz"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="h6" align="center" color={timeLeft < 5000 ? "error" : "primary"}>
          Time Left: {Math.ceil(timeLeft / 1000)}s
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(timeLeft / totalTime) * 100}
          color={timeLeft < 5000 ? "error" : "primary"}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Stack>

      <QuestionCard
        question={currentQuestion}
        onAnswer={(idx) => {
          setSelectedIndex(idx);
          submitAnswer(currentQuestion.id, idx);
          setWaiting(true);
        }}
        disabled={isAnswered}
        selectedIndex={selectedIndex}
      />

      {isAnswered && (
        <Typography align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          Answer submitted! Waiting for others...
        </Typography>
      )}
    </Box>
  );
}
