import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Grid,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  Timeline,
  Assessment,
  School,
  AutoAwesome,
  CalendarToday,
} from "@mui/icons-material";

export default function TopicDetailDialog({ open, onClose, topicData, studentName }) {
  if (!topicData) return null;

  const {
    topic,
    subject,
    score,
    attemptCount,
    lastAttemptDate,
    trend,
    aiChatScore,
    classTestScore,
    assignmentScore,
    aiRecommendation,
  } = topicData;

  const isStrong = score >= 80;
  const isWeak = score < 50;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Topic Analytics
          </Typography>
          <Chip
            label={isStrong ? "Strong Topic" : isWeak ? "Weak Topic" : "Average"}
            color={isStrong ? "success" : isWeak ? "error" : "primary"}
            size="small"
            variant="filled"
          />
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Header Section */}
          <Box>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {topic}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subject} • {studentName}
            </Typography>
          </Box>

          {/* Score & Progress */}
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2">Average Score</Typography>
              <Typography variant="subtitle2" color={isStrong ? "success.main" : isWeak ? "error.main" : "primary.main"}>
                {score}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={score}
              color={isStrong ? "success" : isWeak ? "error" : "primary"}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Detailed Metrics */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box p={1.5} bgcolor="background.default" borderRadius={2} border="1px solid" borderColor="divider">
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Assessment fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary">Total Attempts</Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight="bold">{attemptCount}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box p={1.5} bgcolor="background.default" borderRadius={2} border="1px solid" borderColor="divider">
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Timeline fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary">Performance Trend</Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight="bold" color={trend === "Improving" ? "success.main" : trend === "Declining" ? "error.main" : "text.primary"}>
                  {trend}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box p={1.5} bgcolor="background.default" borderRadius={2} border="1px solid" borderColor="divider">
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <CalendarToday fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary">Last Attempt</Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight="bold">
                  {lastAttemptDate ? new Date(lastAttemptDate).toLocaleDateString() : "N/A"}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box p={1.5} bgcolor="background.default" borderRadius={2} border="1px solid" borderColor="divider">
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <School fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary">Class Test Score</Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight="bold">{classTestScore}</Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider />

          {/* Recommendations */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <AutoAwesome fontSize="small" color="secondary" />
              <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                AI Recommendation
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ p: 1.5, bgcolor: "secondary.lighter", borderRadius: 2, border: "1px solid", borderColor: "secondary.light" }}>
              {aiRecommendation}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
