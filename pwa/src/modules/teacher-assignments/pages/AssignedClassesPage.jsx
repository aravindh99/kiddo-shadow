import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { getMyTeacherAssignments } from "../../teacher-timetable/teacherTimetable.api";
import { useAuth } from "../../../auth/AuthProvider";

export default function AssignedClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (user?.role !== "teacher") return;
      try {
        setLoading(true);
        const res = await getMyTeacherAssignments();
        const data = res.data?.data || res.data || [];
        if (!cancelled) setClasses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load assigned classes", e);
        if (!cancelled) setError("Failed to load assigned classes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

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

  // Group by class and section
  const map = new Map();
  classes.forEach(c => {
    const key = `${c.class_id}-${c.section_id}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        className: c.class?.class_name || "Class",
        sectionName: c.section?.name || c.section_id,
        isClassTeacher: c.is_class_teacher,
        subjects: new Set([c.subject?.name].filter(Boolean))
      });
    } else {
      const existing = map.get(key);
      if (c.subject?.name) existing.subjects.add(c.subject.name);
      if (c.is_class_teacher) existing.isClassTeacher = true;
    }
  });

  const displayClasses = Array.from(map.values());

  return (
    <Container maxWidth="sm" sx={{ mt: 3, pb: 10 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        My Assigned Classes
      </Typography>

      <Stack spacing={2}>
        {displayClasses.length === 0 ? (
          <Alert severity="info">
            No classes assigned.
          </Alert>
        ) : (
          displayClasses.map((c) => (
            <Box
              key={c.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {c.className} - {c.sectionName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Subjects: {c.subjects.size > 0 ? Array.from(c.subjects).join(', ') : "N/A"}
                </Typography>
              </Box>
              
              {c.isClassTeacher && (
                <Chip
                  label="Class Teacher"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              )}
            </Box>
          ))
        )}
      </Stack>
    </Container>
  );
}
