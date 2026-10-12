import {
  Container,
  CircularProgress,
  Alert,
  Typography,
  Stack,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useReportCard } from "./useReportCard";
import ReportCardTable from "./ReportCardTable";

export default function ReportCardPage() {
  const { id } = useParams();
  const { data, loading, error } = useReportCard(id);

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

  const student = data.students?.[0];

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h6">
          Report Card
        </Typography>

        <Typography>
          Exam: {data.exam_type}
        </Typography>

        <Typography>
          Student: {student.student_name}
        </Typography>

        <ReportCardTable subjects={student.marks} />

        <Typography>
          Total: {student.total}
        </Typography>

        <Typography>
          Percentage: {student.percentage}%
        </Typography>
      </Stack>
    </Container>
  );
}
