import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { getStudentTestLockStatus } from "./aiTests.api";

export default function StudentTestLockGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lockData, setLockData] = useState({ locked: false, assignment: null });
  const allowedRoute = location.pathname.startsWith("/student/ai-tests");

  useEffect(() => {
    if (allowedRoute) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function load() {
      try {
        const res = await getStudentTestLockStatus();
        if (!active) return;
        setLockData(res?.data?.data || { locked: false, assignment: null });
      } catch {
        if (active) setLockData({ locked: false, assignment: null });
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [allowedRoute, location.pathname]);

  if (loading) return <CircularProgress size={20} sx={{ position: "fixed", right: 16, bottom: 90, zIndex: 1400 }} />;

  if (!lockData.locked) return null;

  if (allowedRoute) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(15, 23, 42, 0.48)",
        zIndex: 1500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper sx={{ p: 3, borderRadius: 4, maxWidth: 420, width: "100%" }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Finish Your Assigned Test
          </Typography>
          <Alert severity="warning">
            {lockData.assignment?.title || "Assigned test"} is locking the app until completion.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Open the assigned test and complete it to unlock the rest of the student features.
          </Typography>
          <Button variant="contained" onClick={() => navigate(`/student/ai-tests/${lockData.assignment?.id}`)}>
            Go to Test
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

