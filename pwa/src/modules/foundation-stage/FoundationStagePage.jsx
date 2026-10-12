import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  AutoAwesome,
  Extension,
  Insights,
  Science,
  SportsEsports,
  Terminal,
  TravelExplore,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { getFoundationStageModules } from "./foundationStage.api";

const MODE_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "professional", label: "Professional" },
];

const MODULE_ICONS = {
  "logical-thinking-aptitude": <Insights color="primary" />,
  "basic-science-exploration": <Science color="success" />,
  "intro-to-coding": <Terminal color="secondary" />,
  "general-knowledge-builder": <TravelExplore color="info" />,
  "gamified-learning-system": <SportsEsports color="warning" />,
};

export default function FoundationStagePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/parent")
    ? "/parent/foundation-stage"
    : location.pathname.startsWith("/students")
      ? "/students/foundation-stage"
      : "/student/foundation-stage";
  const [mode, setMode] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getFoundationStageModules(mode);
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Failed to load Foundation Stage modules.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const progressValue = useMemo(() => {
    if (!payload?.eligible) return 0;
    return mode === "professional" ? 80 : 45;
  }, [mode, payload?.eligible]);

  return (
    <Container maxWidth="md" sx={{ mt: 3, pb: 10 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <AutoAwesome color="primary" />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Foundation Stage (Class 6-7)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Curiosity, logical thinking, and structured learning engagement.
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Current Class
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {payload?.class?.name || "Not available"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="foundation-mode-label">Track</InputLabel>
                <Select
                  labelId="foundation-mode-label"
                  value={mode}
                  label="Track"
                  onChange={(e) => setMode(e.target.value)}
                  disabled={loading}
                >
                  {MODE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Chip
              icon={<Extension />}
              color={payload?.eligible ? "success" : "default"}
              label={payload?.eligible ? "Eligible" : "Not Eligible"}
            />
            <Chip
              variant="outlined"
              label={`Track: ${mode === "professional" ? "Professional" : "Basic"}`}
            />
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ mt: 2, height: 8, borderRadius: 999 }}
          />
        </CardContent>
      </Card>

      {loading && <Alert severity="info">Loading foundation modules...</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && !payload?.eligible && (
        <Alert severity="warning">{payload?.availability?.reason}</Alert>
      )}

      {!loading && !error && payload?.eligible && (
        <Stack spacing={2}>
          {payload?.modules?.map((module) => (
            <Card key={module.id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  {MODULE_ICONS[module.id] || <AutoAwesome color="primary" />}
                  <Typography variant="h6" fontWeight={700}>
                    {module.title}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {module.summary}
                </Typography>
                <Stack spacing={0.8}>
                  {module.delivery?.map((line) => (
                    <Typography key={line} variant="body2">
                      • {line}
                    </Typography>
                  ))}
                </Stack>
                <Button
                  sx={{ mt: 1.5 }}
                  variant="outlined"
                  onClick={() => navigate(`${base}/${module.id}`)}
                >
                  Open Module
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
