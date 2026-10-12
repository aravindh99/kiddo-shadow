import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import SharedResultCard from "./SharedResultCard";
import { getStudentAssignedTests } from "./aiTests.api";

export default function StudentAssignedTestsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (active) {
          setLoading(true);
          setError("");
        }
        const res = await getStudentAssignedTests();
        if (!active) return;
        setItems(Array.isArray(res?.data?.items) ? res.data.items : []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Could not load assigned tests.");
        setItems([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 3, pb: 10 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Assigned Tests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start your assigned tests, track status, and view results in one place.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : null}

        {!loading && !error && !items.length ? (
          <Alert severity="info">No assigned tests are waiting for you right now.</Alert>
        ) : null}

        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} key={item.assignment_id}>
              <SharedResultCard
                result={item}
                actions={
                  <Stack direction="row" justifyContent="flex-end">
                    <Button variant="contained" onClick={() => navigate(`/student/ai-tests/${item.assignment_id}`)}>
                      {item.attempt_status === "completed" ? "View Result" : "Open Test"}
                    </Button>
                  </Stack>
                }
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

