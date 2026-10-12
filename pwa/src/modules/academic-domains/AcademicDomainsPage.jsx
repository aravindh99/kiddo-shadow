import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MenuBook, School } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAcademicDomainExams } from "./academicDomains.api";

const EXAM_ORDER = ["TNPSC", "JEE", "NEET", "UPSC"];

const EXAM_SUBJECTS = {
  TNPSC: ["General Studies", "Tamil", "History", "Politics"],
  JEE: ["Physics", "Chemistry", "Mathematics"],
  NEET: ["Physics", "Chemistry", "Biology"],
  UPSC: ["General Studies", "History", "Geography", "Politics", "Economy", "Current Affairs"],
};

const TOTAL_MARK_OPTIONS = [100, 200];

export default function AcademicDomainsPage() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getAcademicDomainExams()
      .then((response) => {
        if (!mounted) return;
        const items = response.data?.items || [];
        setDomains(items);
        setSelectedDomain(items[0]?.exam || EXAM_ORDER[0]);
        setError("");
      })
      .catch((apiError) => {
        if (!mounted) return;
        setDomains([]);
        setSelectedDomain(EXAM_ORDER[0]);
        setError(apiError?.response?.data?.message || "Unable to load the question bank.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const mergedDomains = useMemo(() => {
    const domainMap = new Map(domains.map((item) => [item.exam, item]));

    return EXAM_ORDER.map((exam) => {
      const item = domainMap.get(exam);
      return (
        item || {
          exam,
          title: exam,
          summary: `${exam} style practice questions.`,
          marksPerQuestion: exam === "UPSC" ? 2 : exam === "TNPSC" ? 1 : 4,
          totalPapers: 0,
          availableYears: [],
          latestFiveYears: [],
        }
      );
    });
  }, [domains]);

  const activeDomain = useMemo(
    () => mergedDomains.find((item) => item.exam === selectedDomain) || mergedDomains[0] || null,
    [mergedDomains, selectedDomain]
  );

  const subjectOptions = useMemo(
    () => EXAM_SUBJECTS[selectedDomain] || [],
    [selectedDomain]
  );

  useEffect(() => {
    setSelectedSubject(subjectOptions[0] || "");
  }, [subjectOptions]);

  function handleStartPractice(domain) {
    const derivedQuestionCount = Math.round(totalMarks / (domain.marksPerQuestion || 1));

    navigate("/student/quiz/single", {
      state: {
        source: "academic-domains",
        autoStart: true,
        questionBankConfig: {
          source: "academic-domains",
          aiMode: true,
          exam: domain.exam,
          marksPerQuestion: domain.marksPerQuestion,
          totalMarks,
          numQuestions: derivedQuestionCount,
          timeLimitMinutes: totalMarks === 200 ? 20 : 10,
          subject: selectedSubject,
        },
      },
    });
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, pb: 10 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
          <School />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Academic Domains
          </Typography>
          <Typography variant="body2" color="text.secondary">
            TNPSC, NEET, JEE, and UPSC style practice with best-answer MCQ flow.
          </Typography>
        </Box>
      </Stack>

      {loading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading question-bank categories...
          </Typography>
        </Paper>
      )}

      {!loading && error && (
        <Paper
          variant="outlined"
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 3,
            borderColor: "error.light",
            bgcolor: "#fff5f5",
          }}
        >
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        </Paper>
      )}

      {!loading && mergedDomains.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: "stretch" }}
            >
              <TextField
                select
                fullWidth
                label="Domain"
                value={selectedDomain}
                onChange={(event) => setSelectedDomain(event.target.value)}
              >
                {mergedDomains.map((domain) => (
                  <MenuItem key={domain.exam} value={domain.exam}>
                    {domain.exam}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Subject"
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
              >
                {subjectOptions.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              select
              fullWidth
              label="Total Marks"
              value={totalMarks}
              onChange={(event) => setTotalMarks(Number(event.target.value))}
            >
              {TOTAL_MARK_OPTIONS.map((markOption) => (
                <MenuItem key={markOption} value={markOption}>
                  {markOption} Marks
                </MenuItem>
              ))}
            </TextField>

            {activeDomain && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip icon={<MenuBook />} label={`${activeDomain.exam} selected`} />
                <Chip label={`${activeDomain.marksPerQuestion} mark(s) each`} color="secondary" />
                <Chip label={`${totalMarks} total marks`} color="success" />
              </Stack>
            )}

            <Button
              variant="contained"
              size="large"
              disabled={!activeDomain}
              onClick={() => activeDomain && handleStartPractice(activeDomain)}
              sx={{
                alignSelf: "flex-start",
                px: 3,
                py: 1.4,
                borderRadius: 3,
                background: "linear-gradient(90deg, #5b4cf6 0%, #4c46e8 100%)",
                boxShadow: "0 8px 18px rgba(91, 76, 246, 0.28)",
              }}
            >
              Generate Questions
            </Button>
          </Stack>
        </Paper>
      )}

    </Container>
  );
}
