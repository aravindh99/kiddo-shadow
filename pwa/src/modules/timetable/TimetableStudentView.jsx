import { useState } from "react";
import { Box, Typography, Stack, Paper, Tabs, Tab, Container } from "@mui/material";
import { AccessTime, School } from "@mui/icons-material";

export default function TimetableStudentView({ timetable }) {
  // API returns either { saturday: [...] } or { timetable: { saturday: [...] } }
  const slots = timetable?.timetable || timetable || {};
  const days = Object.keys(slots);
  const [activeDay, setActiveDay] = useState(days[0] || "monday");

  const periods = slots[activeDay] || [];

  const fmtTime = (time) => time?.slice(0,5) || "";
  const durationLabel = (start, end) => {
    if (!start || !end) return "";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (Number.isNaN(mins) || mins <= 0) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Container sx={{ mt: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        My Timetable
      </Typography>

      <Tabs
        value={activeDay}
        onChange={(_, v) => setActiveDay(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {days.map(day => (
          <Tab key={day} label={day.slice(0, 3).toUpperCase()} value={day} />
        ))}
      </Tabs>

      <Stack spacing={2} sx={{ pb: 10 }}>
        {periods.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
            No classes scheduled for today.
          </Typography>
        ) : (
          periods.map((p, idx) => {
            const isBreak = p.is_break;
            const teacherName = p.teacher?.name || p.teacher?.user?.name || p.teacher_name || "";
            const start = fmtTime(p.start_time);
            const end = fmtTime(p.end_time);
            const dur = durationLabel(p.start_time, p.end_time);
            const timeLabel = `${start}${end ? ` - ${end}` : ""}`;
            return (
              <Paper
                key={idx}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: 6,
                  borderColor: isBreak ? 'warning.main' : 'primary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  bgcolor: isBreak ? 'warning.light' : 'background.paper'
                }}
              >
                <Box sx={{ mr: 2, color: 'text.secondary' }}>
                  <AccessTime fontSize="small" />
                  <Typography variant="body2" fontWeight="bold">
                    {timeLabel}
                  </Typography>
                  {dur && (
                    <Typography variant="caption" color="text.secondary">
                      {dur}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ textAlign: "right", flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {isBreak ? "Break" : (p.subject?.name || "Subject")}
                  </Typography>
                  {!isBreak && teacherName && (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                      <School fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {teacherName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })
        )}
      </Stack>
    </Container>
  );
}
