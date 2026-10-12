import { Box, Typography, Stack, Paper } from "@mui/material";

export default function TimetableTeacherView({ timetable }) {
  return Object.entries(timetable.timetable).map(([day, periods]) => (
    <Box key={day} sx={{ mb: 3 }}>
      <Typography variant="h6">{day.toUpperCase()}</Typography>

      <Stack spacing={1} sx={{ mt: 1 }}>
        {periods.map((p) => (
          <Paper key={p.period} sx={{ p: 2 }}>
            <Typography>{p.subject.name}</Typography>
            <Typography variant="caption">
              Section {timetable.section_id} | {p.start_time} - {p.end_time}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  ));
}
