import { useState } from "react";
import {
  Container,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Button,
  Stack,
  Card,
  CardContent
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useTeacherTimetable } from "./useTeacherTimetable";
import TeacherTimetableView from "./TeacherTimetableView";
import ManageTimetableDialog from "./ManageTimetableDialog";
import { useTeacherAssignments } from "./useTeacherAssignments";

export default function TeacherTimetablePage() {
  const { timetable, loading, error, refresh } = useTeacherTimetable();
  const { classTeacherSections, assignments, loading: assignmentsLoading } = useTeacherAssignments();
  const [showManage, setShowManage] = useState(false);
  const [manageDay, setManageDay] = useState("monday");

  const canManage = (classTeacherSections?.length || 0) > 0;

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

  const handleManageDay = (day) => {
    setManageDay(day);
    setShowManage(true);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 10 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 4, color: "primary.main" }}>
        My Weekly Timetable
      </Typography>

      <TeacherTimetableView 
        timetable={timetable} 
        onManageDay={handleManageDay}
        canManage={canManage && !assignmentsLoading}
      />

      <ManageTimetableDialog 
        open={showManage} 
        onClose={() => setShowManage(false)}
        onSuccess={() => {
          setShowManage(false);
          refresh();
        }}
        classTeacherSections={classTeacherSections}
        teacherAssignments={assignments}
        teacherTimetable={timetable}
        defaultDay={manageDay}
      />
    </Container>
  );
}
