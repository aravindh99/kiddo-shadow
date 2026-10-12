import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SharedResultCard from "./SharedResultCard";
import {
  getStudentAssignedTest,
  startStudentAssignedTest,
  submitStudentAssignedTest,
} from "./aiTests.api";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StudentAssignedTestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [timerLabel, setTimerLabel] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const autoSubmitTriggeredRef = useRef(false);

  async function load() {
    try {
      setLoading(true);
      const res = await getStudentAssignedTest(id);
      const next = res?.data?.data || null;
      setData(next);
      setAnswers((prev) => {
        const nextAnswers = (next?.questions || []).map((item) => {
          const existing = prev.find((answer) => answer.id === item.id);
          const existingValue = String(existing?.answer || "").trim();
          const serverValue = String(item.answer || "").trim();

          if (next?.submission?.status === "in_progress" && existingValue) {
            return { id: item.id, answer: existing.answer };
          }

          return {
            id: item.id,
            answer: serverValue || existing?.answer || "",
          };
        });

        return nextAnswers;
      });
      setShowValidation(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load this test.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    autoSubmitTriggeredRef.current = false;
  }, [id, data?.submission?.status]);

  const deadline = useMemo(() => {
    if (!data?.submission?.started_at || !data?.assignment?.duration_minutes) return null;
    return new Date(new Date(data.submission.started_at).getTime() + data.assignment.duration_minutes * 60 * 1000);
  }, [data]);

  const scheduledStart = useMemo(() => {
    if (!data?.assignment?.start_time) return null;
    const next = new Date(data.assignment.start_time);
    return Number.isNaN(next.getTime()) ? null : next;
  }, [data?.assignment?.start_time]);

  const scheduledEnd = useMemo(() => {
    if (!data?.assignment?.end_time) return null;
    const next = new Date(data.assignment.end_time);
    return Number.isNaN(next.getTime()) ? null : next;
  }, [data?.assignment?.end_time]);

  const canStartNow = !scheduledStart || Date.now() >= scheduledStart.getTime();

  useEffect(() => {
    if (!deadline || data?.submission?.status !== "in_progress") return undefined;

    const tick = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        if (autoSubmitTriggeredRef.current) return;
        autoSubmitTriggeredRef.current = true;
        setTimerLabel("Time is up. Submitting...");
        handleSubmit({ autoSubmit: true });
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimerLabel(`${mins}m ${String(secs).padStart(2, "0")}s remaining`);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [deadline, data?.submission?.status]);

  const handleStart = async () => {
    try {
      setSaving(true);
      await startStudentAssignedTest(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start this test.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async ({ autoSubmit = false } = {}) => {
    if (saving) return;
    const incompleteQuestions = (data?.questions || []).filter((question) => {
      const answer = answers.find((item) => item.id === question.id)?.answer || "";
      return !String(answer).trim();
    });

    if (!autoSubmit && incompleteQuestions.length) {
      setShowValidation(true);
      return;
    }

    try {
      setSaving(true);
      setShowValidation(false);
      await submitStudentAssignedTest(id, answers, { auto_submit: autoSubmit });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit your answers.");
      autoSubmitTriggeredRef.current = false;
    } finally {
      setSaving(false);
    }
  };

  const result = data?.result;
  const showResult = Boolean(result?.result_visible);
  const canAnswer = data?.submission?.status === "in_progress";
  const unansweredQuestionIds = new Set(
    (data?.questions || [])
      .filter((question) => {
        const answer = answers.find((item) => item.id === question.id)?.answer || "";
        return !String(answer).trim();
      })
      .map((question) => question.id)
  );

  return (
    <Container maxWidth="md" sx={{ py: 3, pb: 10 }}>
      {loading ? <CircularProgress size={24} /> : null}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && data ? (
        <Stack spacing={2}>
          <Button onClick={() => navigate("/student/ai-tests")} sx={{ alignSelf: "flex-start" }}>
            Back to Tests
          </Button>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h5" fontWeight={700}>{data.assignment.title}</Typography>
                <Typography color="text.secondary">
                  {data.assignment.subject_name || "General"} · {data.assignment.chapter_name || "Assessment"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {data.assignment.duration_minutes || "Flexible"} minutes
                </Typography>
                {timerLabel ? <Alert severity="info">{timerLabel}</Alert> : null}
                {data.assignment.lock_mode ? (
                  <Alert severity="warning">Other features stay blocked until you finish this test.</Alert>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          {!showResult ? (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  {data.submission.status === "pending" ? (
                    <>
                      <Typography variant="body1">
                        {canStartNow
                          ? "This test has been assigned to you. Start when you are ready."
                          : "This test is scheduled. You can start it when the scheduled time begins."}
                      </Typography>
                      {scheduledStart || scheduledEnd ? (
                        <Alert severity={canStartNow ? "info" : "warning"}>
                          {scheduledStart ? `Start: ${formatDateTime(scheduledStart)}` : null}
                          {scheduledStart && scheduledEnd ? " | " : ""}
                          {scheduledEnd ? `End: ${formatDateTime(scheduledEnd)}` : null}
                        </Alert>
                      ) : null}
                      <Button variant="contained" onClick={handleStart} disabled={saving || !canStartNow}>
                        {saving ? "Starting..." : "Start Test"}
                      </Button>
                    </>
                  ) : null}

                  {canAnswer ? (
                    <>
                      {(data.questions || []).map((question) => (
                        <TextField
                          key={question.id}
                          id={`student-test-question-${question.id}`}
                          label={`Q${question.id}`}
                          multiline
                          minRows={3}
                          required
                          error={showValidation && unansweredQuestionIds.has(question.id)}
                          value={answers.find((item) => item.id === question.id)?.answer || ""}
                          onChange={(e) =>
                            setAnswers((prev) =>
                              prev.map((item) =>
                                item.id === question.id ? { ...item, answer: e.target.value } : item
                              )
                            )
                          }
                          helperText={
                            showValidation && unansweredQuestionIds.has(question.id)
                              ? "This answer is required."
                              : question.prompt
                          }
                        />
                      ))}
                      <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Submitting..." : "Submit Test"}
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {data?.submission?.status === "completed" && !showResult ? (
            <Alert severity="info">
              Your submission is complete. The result will appear here when the visibility setting allows it.
            </Alert>
          ) : null}

          {showResult ? (
            <Stack spacing={2}>
              <Alert severity="success">
                {result?.score_display ? `Result: ${result.score_display}` : "Result submitted successfully."}
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" onClick={() => navigate("/student/results")}>
                  View Stored Results
                </Button>
                <Button variant="outlined" onClick={() => navigate("/student/ai-tests")}>
                  Back to Assigned Tests
                </Button>
              </Stack>
              <SharedResultCard result={result} />
              {(data.book_answers || []).length ? (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Book Answers
                    </Typography>
                    <Stack spacing={1.25}>
                      {data.book_answers.map((answer, index) => (
                        <Box key={`${index + 1}-${answer.slice(0, 24)}`}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Point {index + 1}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {answer}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}
            </Stack>
          ) : null}

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Question Paper
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{data.assignment.generated_content}</Typography>
            </CardContent>
          </Card>
        </Stack>
      ) : null}
    </Container>
  );
}

