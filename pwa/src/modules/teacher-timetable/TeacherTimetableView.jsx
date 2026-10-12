import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Stack, Chip } from "@mui/material";
import { Edit, CheckCircle } from "@mui/icons-material";
import dayjs from "dayjs";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function TeacherTimetableView({ timetable, onManageDay, canManage }) {
  const currentDayIndex = dayjs().day() === 0 ? 7 : dayjs().day();

  // If the teacher has no periods all week, we can just display the days with an "Add" button
  return DAYS.map((day) => {
    const periods = (timetable?.[day] || []).filter(c => !c.is_break);
    const dayIndex = DAYS.indexOf(day) + 1;
    const isCompleted = dayIndex < currentDayIndex;

    return (
      <Box key={day} sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
            {day}
          </Typography>
          {isCompleted ? (
            <Chip label="Completed" color="success" size="small" icon={<CheckCircle fontSize="small" />} />
          ) : canManage && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => onManageDay(day)}
            >
              Manage
            </Button>
          )}
        </Stack>

        {periods.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No periods scheduled.
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Class</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map((c) => (
                  <TableRow key={c.id} sx={{ bgcolor: c.is_break ? 'warning.lighter' : 'inherit' }}>
                    <TableCell>
                      {c.is_break ? (
                        <Chip label={c.period_number || "B"} size="small" color="warning" />
                      ) : (
                        <Chip label={c.period_number || "P"} size="small" color="primary" />
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">
                        {c.start_time?.slice(0, 5)} - {c.end_time?.slice(0, 5)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color={c.is_break ? "warning.dark" : "text.primary"}>
                        {c.is_break ? (c.title || "Break") : (c.subject?.name || "Subject")}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      {!c.is_break && (
                        <Typography variant="body2" color="text.secondary">
                          {c.class?.class_name || c.Class?.class_name || `Class ${c.class_id}`} - {c.section?.name || c.Section?.name || `Section ${c.section_id}`}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  });
}
