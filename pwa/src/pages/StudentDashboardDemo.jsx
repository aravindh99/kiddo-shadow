import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  Avatar,
  Stack,
} from "@mui/material";
import {
  EmojiEvents,
  FactCheck,
  Assignment,
  ChevronRight,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

export default function StudentDashboardDemo() {
  const theme = useTheme();

  const metrics = {
    attendance: { percentage: 93 },
    ai_tokens: { remaining: 120, used: 80, total: 200 },
    homework_pending: 2,
  };

  const studentName = "Demo Student";

  return (
    <Box sx={{ pb: 2, minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          p: 3,
          pt: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: "white",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
            {studentName[0]}
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            Welcome back, Demo
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper
              sx={{
                p: 2,
                bgcolor: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                color: "white",
                borderRadius: 3,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Attendance
              </Typography>
              <Stack direction="row" alignItems="flex-end" spacing={0.5}>
                <Typography variant="h4" fontWeight="bold">
                  {metrics.attendance.percentage}%
                </Typography>
                <FactCheck sx={{ fontSize: 20, opacity: 0.8, mb: 1 }} />
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={6}>
            <Paper
              sx={{
                p: 2,
                bgcolor: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                color: "white",
                borderRadius: 3,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                AI Tokens
              </Typography>
              <Stack direction="row" alignItems="flex-end" spacing={0.5}>
                <Typography variant="h4" fontWeight="bold">
                  {metrics.ai_tokens.remaining}/{metrics.ai_tokens.total}
                </Typography>
                <EmojiEvents sx={{ fontSize: 20, opacity: 0.8, mb: 1 }} />
              </Stack>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Used: {metrics.ai_tokens.used}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Container sx={{ mt: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Quick Actions (Demo)
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 4, display: "flex", alignItems: "center", p: 2 }}>
              <Avatar sx={{ bgcolor: "#E1F5FE", color: "#039BE5", mr: 2 }}>
                <Assignment />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Homework
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.homework_pending} pending assignments
                </Typography>
              </Box>
              <ChevronRight color="action" />
            </Card>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          This is a public demo page. Login is still required for all real student routes.
        </Typography>
      </Container>
    </Box>
  );
}
