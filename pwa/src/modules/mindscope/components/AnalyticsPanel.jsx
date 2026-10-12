import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { AutoGraph, TrendingUp } from "@mui/icons-material";
import InsightsPanel from "./InsightsPanel";

function TrendLine({ points }) {
  const width = 420;
  const height = 150;
  const max = 100;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - (point.score / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", height: 180 }}>
      <path d={path} fill="none" stroke="#1976d2" strokeWidth="5" strokeLinecap="round" />
      {points.map((point, index) => {
        const x = (index / Math.max(1, points.length - 1)) * width;
        const y = height - (point.score / max) * height;
        return <circle key={point.label} cx={x} cy={y} r="6" fill="#2e7d32" />;
      })}
    </Box>
  );
}

export default function AnalyticsPanel({ snapshot }) {
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} lg={8}>
        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <AutoGraph color="primary" />
                <Typography variant="h6" fontWeight={800}>
                  Subject Comparison
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                {snapshot.subjects.map((item) => (
                  <Box key={item.subject}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Typography fontWeight={700}>{item.subject}</Typography>
                      <Typography color="text.secondary">{item.score}%</Typography>
                    </Stack>
                    <Box sx={{ height: 12, borderRadius: 999, bgcolor: "grey.100", overflow: "hidden" }}>
                      <Box
                        sx={{
                          width: `${item.score}%`,
                          height: "100%",
                          borderRadius: 999,
                          bgcolor: item.score >= item.previous ? "success.main" : "warning.main",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Strength: {item.strength} | Focus: {item.focus}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="h6" fontWeight={800}>
                  Progress Trend
                </Typography>
              </Stack>
              <TrendLine points={snapshot.trend} />
              <Stack direction="row" justifyContent="space-between">
                {snapshot.trend.map((point) => (
                  <Typography key={point.label} variant="caption" color="text.secondary">
                    {point.label}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12} lg={4}>
        <InsightsPanel snapshot={snapshot} />
      </Grid>
    </Grid>
  );
}
