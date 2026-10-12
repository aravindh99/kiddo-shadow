import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { CheckCircle, InfoOutlined } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HOBBY_CATEGORIES,
  HOBBY_LEADERBOARD_STORAGE_KEY,
  HOBBY_SELECTION_STORAGE_KEY,
} from "./hobbies.data";

export default function HobbiesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const studentBase = location.pathname.startsWith("/students") ? "/students" : "/student";
  const [selectedIds, setSelectedIds] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.sessionStorage.getItem(HOBBY_SELECTION_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch {
      return [];
    }
  });
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [leaderboardResult, setLeaderboardResult] = useState(null);
  const [leaderboardView, setLeaderboardView] = useState("class");

  const selectedCount = selectedIds.length;
  const canContinue = selectedCount === 3;
  const infoOpen = Boolean(infoAnchorEl);
  const hasLockedSelection = selectedCount === 3;
  const selectedCategories = HOBBY_CATEGORIES.filter((category) =>
    selectedIds.includes(category.id)
  );

  const helperText = useMemo(() => {
    if (selectedCount === 3) {
      return "You selected 3 categories. Continue to the next step.";
    }
    return `Choose exactly 3 categories. ${3 - selectedCount} left to select.`;
  }, [selectedCount]);
  const leaderboardEntries = useMemo(() => {
    if (!leaderboardResult?.entries?.length) return [];
    if (leaderboardView === "class") return leaderboardResult.entries;

    return [
      {
        rank: 1,
        name: "Ananya",
        badge: "School Topper",
        points: 95,
        xp: 160,
      },
      {
        rank: 2,
        name: "Rohan",
        badge: "Master Solver",
        points: 88,
        xp: 145,
      },
      {
        rank: 3,
        name: leaderboardResult.entries.find((entry) => entry.highlight)?.name || "You",
        badge: leaderboardResult.entries.find((entry) => entry.highlight)?.badge || "Quick Thinker",
        points: leaderboardResult.entries.find((entry) => entry.highlight)?.points || 40,
        xp: leaderboardResult.entries.find((entry) => entry.highlight)?.xp || 80,
        highlight: true,
      },
      {
        rank: 4,
        name: "Meera",
        badge: "Pattern Pro",
        points: 72,
        xp: 120,
      },
      {
        rank: 5,
        name: "Arjun",
        badge: "Focus Builder",
        points: 66,
        xp: 110,
      },
    ];
  }, [leaderboardResult, leaderboardView]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(HOBBY_LEADERBOARD_STORAGE_KEY);
      const parsed = JSON.parse(raw || "null");
      setLeaderboardResult(parsed || null);
    } catch {
      setLeaderboardResult(null);
    }
  }, []);

  const toggleCategory = (categoryId) => {
    setSelectedIds((current) => {
      let nextSelection;

      if (current.includes(categoryId)) {
        nextSelection = current.filter((id) => id !== categoryId);
      } else if (current.length >= 3) {
        nextSelection = current;
      } else {
        nextSelection = [...current, categoryId];
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          HOBBY_SELECTION_STORAGE_KEY,
          JSON.stringify(nextSelection)
        );
      }

      return nextSelection;
    });
  };

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        HOBBY_SELECTION_STORAGE_KEY,
        JSON.stringify(selectedIds)
      );
    }
    navigate(`${studentBase}/hobbies/selected`);
  };

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
                Hobbies
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {hasLockedSelection
                  ? "Your 3 selected categories are ready to play."
                  : "Pick exactly 3 categories to unlock your next step."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                color={canContinue ? "success" : "primary"}
                variant={canContinue ? "filled" : "outlined"}
                icon={canContinue ? <CheckCircle /> : undefined}
                label={`${selectedCount}/3 selected`}
                sx={{ fontWeight: 700 }}
              />
              <IconButton
                color="primary"
                onClick={(event) => setInfoAnchorEl(event.currentTarget)}
                aria-label="Show hobby selection help"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <InfoOutlined />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        <Popover
          open={infoOpen}
          anchorEl={infoAnchorEl}
          onClose={() => setInfoAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box sx={{ maxWidth: 280, p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
              Selection Help
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {helperText}
            </Typography>
          </Box>
        </Popover>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {hasLockedSelection
              ? "Selection is saved. Open any category below to continue."
              : "Tap a card to select or remove it."}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasLockedSelection
              ? "Marks and leaderboard updates will continue from these saved hobbies."
              : "After selecting 3 categories, continue to the next page."}
          </Typography>
        </Box>

        {leaderboardResult?.entries?.length ? (
          <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Latest Leaderboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {leaderboardResult.topic} results with XP, badges, and points.
                  </Typography>
                </Box>
                <Chip color="primary" label={`${leaderboardResult.percentage}% Score`} />
              </Stack>

              <ToggleButtonGroup
                exclusive
                value={leaderboardView}
                onChange={(_, nextValue) => {
                  if (nextValue) setLeaderboardView(nextValue);
                }}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="class">Class Wise</ToggleButton>
                <ToggleButton value="school">Overall School</ToggleButton>
              </ToggleButtonGroup>

              <Alert severity="success" sx={{ mb: 2 }}>
                Result saved. Leaderboard is now shown here on the hobbies page.
              </Alert>

              <Stack spacing={1.25}>
                {leaderboardEntries.map((entry) => (
                  <Card
                    key={`${entry.name}-${entry.rank}`}
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      bgcolor: entry.highlight ? "rgba(25,118,210,0.06)" : "background.paper",
                      borderColor: entry.highlight ? "primary.main" : "divider",
                    }}
                  >
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                      >
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              bgcolor: entry.highlight ? "primary.main" : "grey.300",
                            }}
                          >
                            {entry.rank}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {entry.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Badge: {entry.badge}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip size="small" label={`${entry.points} Points`} />
                          <Chip size="small" color="primary" label={`${entry.xp} XP`} />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        <Box>
          <Typography variant="h5" fontWeight={700}>
            {hasLockedSelection ? "Selected Hobbies" : "Hobbies"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasLockedSelection
              ? "Only your saved 3 categories are shown here."
              : "Choose your favorite learning tracks."}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {(hasLockedSelection ? selectedCategories : HOBBY_CATEGORIES).map((category) => {
            const Icon = category.icon;
            const isSelected = selectedIds.includes(category.id);

            return (
              <Grid item xs={12} sm={6} key={category.id}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    border: isSelected ? "2px solid" : "1px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    boxShadow: isSelected
                      ? "0 18px 36px rgba(84,79,233,0.18)"
                      : "0 10px 24px rgba(15,23,42,0.08)",
                    transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
                    overflow: "hidden",
                  }}
                >
                  <CardActionArea
                    sx={{
                      height: "100%",
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() =>
                      hasLockedSelection
                        ? navigate(`${studentBase}/learning-analytics/${category.id}`)
                        : toggleCategory(category.id)
                    }
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        height: "100%",
                        p: 2.5,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              display: "grid",
                              placeItems: "center",
                              borderRadius: 3,
                              bgcolor: isSelected ? "primary.main" : "rgba(84,79,233,0.10)",
                              color: isSelected ? "primary.contrastText" : "primary.main",
                            }}
                          >
                            <Icon />
                          </Box>
                          <Typography variant="h6" fontWeight={700}>
                            {category.title}
                          </Typography>
                        </Stack>
                        <Chip
                          color={isSelected ? "primary" : "default"}
                          label={
                            hasLockedSelection
                              ? "Open"
                              : isSelected
                                ? "Selected"
                                : "Select"
                          }
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ flexGrow: 1 }}
                      >
                        {category.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {!hasLockedSelection ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
            <Button
              variant="contained"
              onClick={handleContinue}
              disabled={!canContinue}
              sx={{
                minWidth: 160,
                borderRadius: 999,
                px: 3,
                py: 1.1,
                fontWeight: 700,
              }}
            >
              Continue
            </Button>
          </Box>
        ) : null}
      </Stack>
    </Container>
  );
}
