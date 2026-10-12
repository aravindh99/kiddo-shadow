import { Card, CardContent, Typography, Stack, Box, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { getMyTeacherTimetable } from "../teacher-timetable/teacherTimetable.api";
import { useAuth } from "../../auth/AuthProvider";

export default function TeacherUpcomingClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (user?.role !== "teacher") return;
    load();
  }, [user?.role]);

  async function load() {
    try {
      const today = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "long" }).toLowerCase();
      const res = await getMyTeacherTimetable();
      const grouped = res.data?.data || res.data || {};
      setClasses(grouped[today] || []);
    } catch (error) {
      console.error("Failed to load teacher upcoming classes", error);
      setClasses([]);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Ongoing":
        return "success";
      case "Upcoming":
        return "primary";
      case "Completed":
        return "default";
      default:
        return "default";
    }
  };

  const displayClasses = classes.filter((c) => !c.is_break);
  const nextClass = displayClasses.find((c) => c.status === "Ongoing") || displayClasses.find((c) => c.status === "Upcoming");

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Today's Classes
        </Typography>

        <Stack spacing={2}>
          {!nextClass ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3, fontStyle: 'italic' }}>
              No upcoming classes for today.
            </Typography>
          ) : (
            <Box
              key={nextClass.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: nextClass.status === "Ongoing" ? 'success.light' : 'divider',
                bgcolor: nextClass.status === "Ongoing" ? 'rgba(46, 125, 50, 0.04)' : 'background.paper',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                boxShadow: nextClass.status === "Ongoing" ? '0 2px 8px rgba(46, 125, 50, 0.08)' : 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    fontWeight: 'bold',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.85rem',
                    minWidth: 40,
                    textAlign: 'center',
                  }}
                >
                  {nextClass.period_number}
                </Box>
                <Box>
                  <Typography fontWeight={600} variant="body1">
                    {nextClass.subject?.name || "Subject"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {nextClass.start_time.slice(0, 5)} - {nextClass.end_time.slice(0, 5)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                <Box sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="body2" fontWeight={500}>
                    {nextClass.class?.class_name || "Class"} - {nextClass.section?.name || nextClass.section_id}
                  </Typography>
                </Box>
                <Chip
                  label={nextClass.status}
                  color={getStatusColor(nextClass.status)}
                  size="small"
                  variant={nextClass.status === "Ongoing" ? "filled" : "outlined"}
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
