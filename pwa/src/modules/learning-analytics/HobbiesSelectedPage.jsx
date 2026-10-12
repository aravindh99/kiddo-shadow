import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HOBBY_CATEGORIES,
  HOBBY_SELECTION_STORAGE_KEY,
} from "./hobbies.data";

export default function HobbiesSelectedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const studentBase = location.pathname.startsWith("/students") ? "/students" : "/student";

  const selectedIds = useMemo(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.sessionStorage.getItem(HOBBY_SELECTION_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const selectedCategories = HOBBY_CATEGORIES.filter((category) =>
    selectedIds.includes(category.id)
  );

  if (selectedCategories.length !== 3) {
    return (
      <Container maxWidth="sm" sx={{ mt: 3, pb: 10 }}>
        <Stack spacing={2}>
          <Alert severity="warning">
            Please choose exactly 3 hobbies first.
          </Alert>
          <Button variant="contained" onClick={() => navigate(`${studentBase}/hobbies`)}>
            Back to Hobbies
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, pb: 10 }}>
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(84,79,233,0.08) 0%, rgba(84,79,233,0.02) 55%, rgba(255,255,255,0.95) 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Selected Hobbies
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                These 3 categories are active now. The remaining 1 category is hidden.
              </Typography>
            </Box>
            <Button
              variant="contained"
              disableElevation
              startIcon={<CheckCircle />}
              sx={{
                borderRadius: 999,
                px: 2.5,
                py: 1,
                fontWeight: 700,
              }}
            >
              3 Selected
            </Button>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h5" fontWeight={700}>
            Selected Hobbies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Open any category below to continue learning.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {selectedCategories.map((category) => {
            const Icon = category.icon;

            return (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card
                  sx={{
                    height: "100%",
                    minHeight: 190,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      height: "100%",
                      p: 2.5,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 3,
                          bgcolor: "rgba(84,79,233,0.10)",
                          color: "primary.main",
                          flexShrink: 0,
                        }}
                      >
                        <Icon />
                      </Box>
                      <Typography variant="h6" fontWeight={700}>
                        {category.title}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {category.description}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`${studentBase}/learning-analytics/${category.id}`)}
                      sx={{
                        alignSelf: "flex-start",
                        borderRadius: 999,
                        px: 2.5,
                        py: 1,
                        fontWeight: 700,
                        minWidth: 120,
                        mt: 0.5,
                      }}
                    >
                      Open
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Container>
  );
}
