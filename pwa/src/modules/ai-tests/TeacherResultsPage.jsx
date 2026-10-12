import { Box, Container, Stack, Typography } from "@mui/material";
import TeacherAssignedTestsPanel from "./TeacherAssignedTestsPanel";

export default function TeacherResultsPage() {
  return (
    <Box
      sx={{
        minHeight: "100%",
        background:
          "linear-gradient(180deg, #f7f9fc 0%, #ffffff 28%, #ffffff 100%)",
        pb: 10,
      }}
    >
      <Container maxWidth="xl" sx={{ pt: 3, px: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            mb: 3,
            borderRadius: 4,
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3.5 },
            color: "#0f172a",
            background:
              "linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(14,165,233,0.08) 100%)",
            border: "1px solid rgba(148,163,184,0.18)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ letterSpacing: "0.18em", color: "#4f46e5", fontWeight: 700 }}>
              Teacher Workspace
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              Results Review
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 720, color: "#475569" }}>
              Review class performance, open individual submissions, and publish student results from one clean place.
            </Typography>
          </Stack>
        </Box>

        <TeacherAssignedTestsPanel />
      </Container>
    </Box>
  );
}
