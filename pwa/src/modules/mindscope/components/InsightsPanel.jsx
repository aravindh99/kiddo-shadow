import { Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { AutoAwesome, TipsAndUpdates } from "@mui/icons-material";

export default function InsightsPanel({ snapshot }) {
  return (
    <Grid container spacing={2}>
      {snapshot.kpis.map((item) => (
        <Grid item xs={12} sm={4} key={item.label}>
          <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {item.label}
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {item.value}
              </Typography>
              <Chip size="small" color={item.tone} label="Live mock data" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <AutoAwesome color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Smart Summary
              </Typography>
            </Stack>
            <Stack spacing={1.25}>
              {snapshot.summaries.map((summary) => (
                <Stack direction="row" spacing={1} alignItems="flex-start" key={summary}>
                  <TipsAndUpdates fontSize="small" color="warning" sx={{ mt: 0.25 }} />
                  <Typography variant="body2" color="text.secondary">
                    {summary}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
