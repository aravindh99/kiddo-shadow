import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import SharedResultCard from "./SharedResultCard";
import { getStudentAssignedTests } from "./aiTests.api";

export default function StudentResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getStudentAssignedTests();
        setItems(Array.isArray(res?.data?.items) ? res.data.items : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load results.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const completedResults = useMemo(
    () => items.filter((item) => item.attempt_status === "completed"),
    [items]
  );

  const visibleResults = useMemo(
    () => completedResults.filter((item) => item.result_visible),
    [completedResults]
  );

  const sortedResults = useMemo(
    () =>
      [...completedResults].sort((a, b) => {
        const timeA = a?.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const timeB = b?.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return timeB - timeA;
      }),
    [completedResults]
  );

  const averageScore = useMemo(() => {
    if (!visibleResults.length) return 0;
    const total = visibleResults.reduce((sum, item) => sum + Number(item.percentage || 0), 0);
    return Math.round(total / visibleResults.length);
  }, [visibleResults]);

  const studentBase = location.pathname.startsWith("/students") ? "/students" : "/student";

  return (
    <Container maxWidth="md" sx={{ py: 3, pb: 10 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stored test results with subject, score, and date-wise history.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : null}

        {!loading && completedResults.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip color="primary" label={`Completed ${completedResults.length}`} />
            <Chip color="success" label={`Visible ${visibleResults.length}`} />
            <Chip label={`Average ${averageScore}%`} />
          </Stack>
        ) : null}

        {!loading && !error && !completedResults.length ? (
          <Alert severity="info">Complete your first test to see results here.</Alert>
        ) : null}

        <Grid container spacing={2}>
          {sortedResults.map((item) => (
            <Grid item xs={12} key={item.assignment_id}>
              <SharedResultCard
                result={item}
                actions={
                  <Stack direction="row" justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => navigate(`${studentBase}/ai-tests/${item.assignment_id}`)}>
                      {item.result_visible ? "Open Result" : "Open Submission"}
                    </Button>
                  </Stack>
                }
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
