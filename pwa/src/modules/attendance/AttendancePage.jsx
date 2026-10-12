import {
  Container,
  CircularProgress,
  Alert,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useAttendance } from "./useAttendance";
import AttendanceSummary from "./AttendanceSummary";
import AttendanceCalendar from "./AttendanceCalendar";
import { useAuth } from "../../auth/AuthProvider";
import { useProfile } from "../profile/useProfile";
import { useParentChild } from "../parents/ParentChildContext";
import ParentChildSwitcher from "../parents/ParentChildSwitcher";

export default function AttendancePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { selectedChild } = useParentChild();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));

  const filters = useMemo(() => {
    const from_date = selectedMonth.startOf("month").format("YYYY-MM-DD");
    const to_date = selectedMonth.endOf("month").format("YYYY-MM-DD");
    return {
      from_date,
      to_date,
      ...(user?.role === "parent" && selectedChild?.id
        ? { student_id: selectedChild.id }
        : {}),
    };
  }, [selectedMonth, selectedChild?.id, user?.role]);

  const { summary, details, loading, error } = useAttendance(filters);
  const studentName =
    user?.role === "parent"
      ? selectedChild?.name ||
        profile?.student?.user?.name ||
        profile?.student?.User?.name ||
        profile?.student?.name ||
        details?.[0]?.student?.user?.name ||
        details?.[0]?.student?.User?.name ||
        "Student"
      : user?.name || "Student";

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, pb: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h6">Attendance</Typography>
        {user?.role === "parent" ? <ParentChildSwitcher label="Student" /> : null}
        <Typography variant="body2" color="text.secondary">
          Student Name: {studentName}
        </Typography>

        {summary && <AttendanceSummary summary={summary} />}

        <AttendanceCalendar
          details={details}
          month={selectedMonth}
          onMonthChange={setSelectedMonth}
          monthsBack={6}
        />
      </Stack>
    </Container>
  );
}
