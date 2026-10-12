import { Box, Typography, Stack, Paper, Container } from "@mui/material";

export default function TimetableParentView({ timetable }) {
  const slots = timetable?.timetable || timetable || {};
  const days = Object.entries(slots);

  return (
    <Container maxWidth="sm" sx={{ mt: 3, pb: 10 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Child Timetable
      </Typography>

      {days.length === 0 ? (
        <Typography color="text.secondary">
          No timetable is available for the selected child yet.
        </Typography>
      ) : (
        days.map(([day, periods]) => (
          <Box key={day} sx={{ mb: 3 }}>
            <Typography variant="h6">{day.toUpperCase()}</Typography>

            <Stack spacing={1} sx={{ mt: 1 }}>
              {(Array.isArray(periods) ? periods : []).map((p, index) => (
                <Paper key={p.period || `${day}-${index}`} sx={{ p: 2 }}>
                  <Typography>{p.subject?.name || "Subject"}</Typography>
                  <Typography variant="caption">
                    {p.start_time || "--:--"} - {p.end_time || "--:--"}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        ))
      )}
    </Container>
  );
}
