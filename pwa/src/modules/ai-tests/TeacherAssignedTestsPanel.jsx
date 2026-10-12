import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  getTeacherAssignedTest,
  getTeacherAssignedTests,
  reviewTeacherAssignedSubmission,
} from "./aiTests.api";

const emptyReview = {
  score: "",
  correct_answers: "",
  wrong_answers: "",
  strong_topics: "",
  weak_topics: "",
  feedback: "",
  publish_result: true,
};

export default function TeacherAssignedTestsPanel({ refreshKey = 0 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [reviewSaving, setReviewSaving] = useState(false);

  async function loadList() {
    try {
      setLoading(true);
      const res = await getTeacherAssignedTests();
      setItems(res?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load assigned tests.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    try {
      setDetailLoading(true);
      const res = await getTeacherAssignedTest(id);
      setDetail(res?.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load test results.");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, [refreshKey]);

  const selectedAssignment = useMemo(
    () => items.find((item) => String(item.id) === String(detailTarget?.id)) || null,
    [items, detailTarget]
  );

  const openDetail = async (item) => {
    setDetailTarget(item);
    await loadDetail(item.id);
  };

  const openReview = (row) => {
    setReviewTarget(row);
    setReviewForm({
      score: row.score ?? "",
      correct_answers: row.correct_answers ?? "",
      wrong_answers: row.wrong_answers ?? "",
      strong_topics: (row.strong_topics || []).join(", "),
      weak_topics: (row.weak_topics || []).join(", "),
      feedback: row.feedback || "",
      publish_result: true,
    });
  };

  const handleReviewSave = async () => {
    if (!reviewTarget || !detail) return;
    try {
      setReviewSaving(true);
      await reviewTeacherAssignedSubmission(detail.id, reviewTarget.submission_id, {
        score: Number(reviewForm.score || 0),
        correct_answers: Number(reviewForm.correct_answers || 0),
        wrong_answers: Number(reviewForm.wrong_answers || 0),
        strong_topics: reviewForm.strong_topics
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        weak_topics: reviewForm.weak_topics
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        feedback: reviewForm.feedback,
        publish_result: reviewForm.publish_result,
      });
      setReviewTarget(null);
      await loadDetail(detail.id);
      await loadList();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save the review.");
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <Grid container spacing={3} sx={{ mt: 0 }}>
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 4,
            border: "1px solid rgba(148,163,184,0.18)",
            boxShadow: "0 16px 36px rgba(15, 23, 42, 0.06)",
            bgcolor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography variant="overline" sx={{ color: "#6366f1", fontWeight: 700, letterSpacing: "0.14em" }}>
                    Results
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    Test Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Full page table view. Click view to open class students and individual marks.
                  </Typography>
                </Box>
                <Chip
                  label={`${items.length} Tests`}
                  sx={{ alignSelf: "flex-start", borderRadius: 999, bgcolor: "rgba(99,102,241,0.08)", color: "#4338ca" }}
                />
              </Stack>
              {error && <Alert severity="error">{error}</Alert>}
              {loading ? <CircularProgress size={24} /> : null}
              {!loading && !items.length ? (
                <Alert severity="info">No assigned tests yet. Generate a paper and assign it to students.</Alert>
              ) : null}
              {!loading && items.length ? (
                <TableContainer sx={{ border: "1px solid rgba(148,163,184,0.16)", borderRadius: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Test</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Students</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Completed</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Balance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Avg</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Options</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{
                            "& .MuiTableCell-root": { borderColor: "rgba(148,163,184,0.12)" },
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={700}>{item.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.subject_name || item.subject?.name || "General"}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.class?.class_name || ""}-{item.section?.name || ""}</TableCell>
                          <TableCell align="center">{item.summary?.total_students || 0}</TableCell>
                          <TableCell align="center">
                            <Chip size="small" color="success" label={item.summary?.attempted || 0} sx={{ borderRadius: 999 }} />
                          </TableCell>
                          <TableCell align="center">
                            <Chip size="small" color="warning" label={item.summary?.pending || 0} sx={{ borderRadius: 999 }} />
                          </TableCell>
                          <TableCell align="center">{Math.round(item.summary?.class_average_percentage || 0)}%</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => openDetail(item)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={Boolean(detailTarget)} onClose={() => setDetailTarget(null)} fullWidth maxWidth="lg">
        <DialogTitle>{detail?.title || detailTarget?.title || "Test Details"}</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? <CircularProgress size={24} /> : null}
          {!detailLoading && detail ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedAssignment?.subject_name || selectedAssignment?.subject?.name || "General"} · {selectedAssignment?.class?.class_name || ""}-{selectedAssignment?.section?.name || ""}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAssignment?.chapter_name || "Stored result history is shown date wise below."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weak topics across class: {(detail.summary?.weak_topics_across_class || []).map((item) => `${item.topic} (${item.count})`).join(", ") || "No common weak topics yet"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Completed ${detail.summary?.attempted || 0}`} color="success" size="small" sx={{ borderRadius: 999 }} />
                  <Chip label={`Balance ${detail.summary?.pending || 0}`} color="warning" size="small" sx={{ borderRadius: 999 }} />
                  <Chip label={`Missed ${detail.summary?.missed || 0}`} color="error" size="small" sx={{ borderRadius: 999 }} />
                  <Chip label={`Avg ${Math.round(detail.summary?.class_average_percentage || 0)}%`} size="small" sx={{ borderRadius: 999 }} />
                </Stack>
              </Stack>

              <TableContainer sx={{ border: "1px solid rgba(148,163,184,0.16)", borderRadius: 3 }}>
                <Table size="small">
                      <TableHead sx={{ bgcolor: "#f8fafc" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Mark Score</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Correct</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Wrong</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Time</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Submitted</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(detail.result_rows || [])
                          .slice()
                          .sort((a, b) => {
                            const timeA = a?.submitted_at ? new Date(a.submitted_at).getTime() : 0;
                            const timeB = b?.submitted_at ? new Date(b.submitted_at).getTime() : 0;
                            return timeB - timeA;
                          })
                          .map((row) => (
                          <TableRow key={row.submission_id} hover sx={{ "& .MuiTableCell-root": { borderColor: "rgba(148,163,184,0.12)" } }}>
                        <TableCell>
                          <Typography fontWeight={700}>{row.student_name || "Student"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.class_section || "Class"}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {row.subject || "General"}
                            {row.chapter_name ? ` · ${row.chapter_name}` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={
                              row.attempt_status === "completed"
                                ? "success"
                                : row.attempt_status === "missed"
                                  ? "error"
                                  : "warning"
                            }
                            label={
                              row.attempt_status === "completed"
                                ? "Completed"
                                : row.attempt_status === "missed"
                                  ? "Missed"
                                  : "Pending"
                            }
                            sx={{ borderRadius: 999 }}
                          />
                        </TableCell>
                        <TableCell align="center">{row.score_display || "--"}</TableCell>
                        <TableCell align="center">{row.correct_answers ?? "--"}</TableCell>
                        <TableCell align="center">{row.wrong_answers ?? "--"}</TableCell>
                        <TableCell align="center">{row.time_taken_label || "--"}</TableCell>
                        <TableCell align="center">
                          {row.submitted_at
                            ? new Date(row.submitted_at).toLocaleDateString([], {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "--"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(reviewTarget)} onClose={() => setReviewTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review Student Result</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Score"
              type="number"
              value={reviewForm.score}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, score: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Correct Answers"
                  type="number"
                  value={reviewForm.correct_answers}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, correct_answers: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Wrong Answers"
                  type="number"
                  value={reviewForm.wrong_answers}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, wrong_answers: e.target.value }))}
                />
              </Grid>
            </Grid>
            <TextField
              label="Strong Topics"
              placeholder="Fractions, Word Problems"
              value={reviewForm.strong_topics}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, strong_topics: e.target.value }))}
            />
            <TextField
              label="Weak Topics"
              placeholder="Concept recall, Steps"
              value={reviewForm.weak_topics}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, weak_topics: e.target.value }))}
            />
            <TextField
              label="Feedback"
              multiline
              minRows={3}
              value={reviewForm.feedback}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, feedback: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewTarget(null)}>Cancel</Button>
          <Button onClick={handleReviewSave} variant="contained" disabled={reviewSaving}>
            {reviewSaving ? "Saving..." : "Save Review"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

