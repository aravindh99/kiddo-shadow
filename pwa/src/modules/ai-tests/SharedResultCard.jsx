import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

function statusColor(status) {
  if (status === "completed") return "success";
  if (status === "missed") return "error";
  return "warning";
}

export default function SharedResultCard({ result, compact = false, actions = null }) {
  if (!result) return null;

  const submittedDateLabel = result.submitted_at
    ? new Date(result.submitted_at).toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <Card
      sx={{
        borderRadius: 3,
        height: "100%",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 2.5 }}>
        <Stack spacing={compact ? 1.25 : 1.75}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                {result.test_title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.student_name} · {result.class_section || "Class"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.subject}
              </Typography>
              {result.chapter_name ? (
                <Typography variant="body2" color="text.secondary">
                  {result.chapter_name}
                </Typography>
              ) : null}
              {result.submitted_at ? (
                <Typography variant="caption" color="text.secondary">
                  {submittedDateLabel}
                </Typography>
              ) : null}
            </Box>
            <Chip
              size="small"
              color={statusColor(result.attempt_status)}
              sx={{ borderRadius: 999, fontWeight: 700 }}
              label={
                result.attempt_status === "completed"
                  ? "Completed"
                  : result.attempt_status === "missed"
                    ? "Not Attempted"
                    : "Pending"
              }
            />
          </Stack>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" fontWeight={700}>
                {result.score_display || "Result pending"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {result.result_visible ? `${Math.round(result.percentage || 0)}%` : "Hidden"}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Number(result.progress_value || 0)}
              sx={{
                mt: 0.75,
                height: 8,
                borderRadius: 999,
                bgcolor: "rgba(99,102,241,0.12)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #818cf8 0%, #6366f1 100%)",
                },
              }}
            />
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {result.subject ? (
              <Chip size="small" variant="outlined" label={`Subject ${result.subject}`} sx={{ borderRadius: 999 }} />
            ) : null}
            {submittedDateLabel ? (
              <Chip size="small" variant="outlined" label={`Date ${submittedDateLabel}`} sx={{ borderRadius: 999 }} />
            ) : null}
            <Chip size="small" variant="outlined" label={`Time ${result.time_taken_label || "--"}`} sx={{ borderRadius: 999 }} />
            <Chip size="small" variant="outlined" label={`Correct ${result.correct_answers ?? "--"}`} sx={{ borderRadius: 999 }} />
            <Chip size="small" variant="outlined" label={`Wrong ${result.wrong_answers ?? "--"}`} sx={{ borderRadius: 999 }} />
          </Stack>

          {!compact && (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Strong Topics
                </Typography>
                <Typography variant="body2">
                  {(result.strong_topics || []).length ? result.strong_topics.join(", ") : "No highlights yet"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Weak Topics
                </Typography>
                <Typography variant="body2">
                  {(result.weak_topics || []).length ? result.weak_topics.join(", ") : "No weak topics recorded"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Feedback
                </Typography>
                <Typography variant="body2">
                  {result.feedback || "Feedback will appear here once the result is ready."}
                </Typography>
              </Box>
            </>
          )}

          {actions}
        </Stack>
      </CardContent>
    </Card>
  );
}

