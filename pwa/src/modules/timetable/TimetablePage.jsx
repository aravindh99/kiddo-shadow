import {
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { useTimetable } from "./useTimetable";

import TimetableStudentView from "./TimetableStudentView";
import TimetableTeacherView from "./TimetableTeacherView";
import TimetableParentView from "./TimetableParentView";

export default function TimetablePage() {
  const { user } = useAuth();
  const { timetable, loading, error } = useTimetable();

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

  if (user.role === "student")
    return <TimetableStudentView timetable={timetable} />;

  if (user.role === "teacher")
    return <TimetableTeacherView timetable={timetable} />;

  if (user.role === "parent")
    return <TimetableParentView timetable={timetable} />;

  return null;
}
