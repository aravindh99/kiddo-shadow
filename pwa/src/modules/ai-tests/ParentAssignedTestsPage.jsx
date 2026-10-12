import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import SharedResultCard from "./SharedResultCard";
import { getParentAssignedTests } from "./aiTests.api";
import { useParentChild } from "../parents/ParentChildContext";
import ParentChildSwitcher from "../parents/ParentChildSwitcher";

export default function ParentAssignedTestsPage() {
  const { selectedChild } = useParentChild();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getParentAssignedTests(selectedChild?.id ? { student_id: selectedChild.id } : {});
        setItems(res?.data?.items || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load test performance.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedChild?.id]);

  return (
    <Container maxWidth="md" sx={{ py: 3, pb: 10 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Test Performance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Clear updates on assigned tests, completion, and learning areas that need support.
          </Typography>
          <ParentChildSwitcher label="Student" />
          {selectedChild?.name ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Viewing results for {selectedChild.name}
            </Typography>
          ) : null}
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? <CircularProgress size={24} /> : null}
        {!loading && !items.length ? <Alert severity="info">No assigned test performance is available yet.</Alert> : null}
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} key={`${item.assignment_id}-${item.student_id}`}>
              <SharedResultCard result={item} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

