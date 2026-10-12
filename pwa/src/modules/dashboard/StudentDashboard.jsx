import { useEffect, useState } from "react";
import { Container, Typography, Grid, CircularProgress, Alert } from "@mui/material";
import DashboardCard from "./DashboardCard";
import { fetchStudentDashboard } from "./dashboard.api";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const result = await fetchStudentDashboard();
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        const msg =
          err?.response?.data?.message || "Failed to load dashboard data.";
        setError(msg);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const metrics = data?.metrics || {
    attendance: { percentage: 0 },
    ai_tokens: { remaining: 0, used: 0, total: 0 },
    homework_pending: 0,
  };

  const attendancePercent =
    typeof metrics.attendance?.percentage === "number"
      ? `${Math.round(metrics.attendance.percentage)}%`
      : "--";

  return (
    <Container maxWidth="sm" sx={{ mt: 4, pb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Student Dashboard
      </Typography>

      {loading && (
        <CircularProgress size={24} sx={{ mt: 2 }} />
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <DashboardCard
            title="Attendance"
            value={attendancePercent}
            subtitle="Overall"
          />
        </Grid>

        <Grid item xs={6}>
          <DashboardCard
            title="Homework"
            value={metrics.homework_pending ?? "--"}
            subtitle="Pending"
          />
        </Grid>

        <Grid item xs={6}>
          <DashboardCard
            title="Quizzes"
            value="--"
            subtitle="Completed"
          />
        </Grid>

        <Grid item xs={6}>
          <DashboardCard
            title="AI Tokens"
            value={`${metrics.ai_tokens?.remaining ?? 0}/${metrics.ai_tokens?.total ?? 0}`}
            subtitle={`Used: ${metrics.ai_tokens?.used ?? 0}`}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
