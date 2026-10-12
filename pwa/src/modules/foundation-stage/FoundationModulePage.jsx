import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Alert,
  Box,
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
import { AutoAwesome } from "@mui/icons-material";
import { getFoundationStageModuleById } from "./foundationStage.api";

const MODE_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "professional", label: "Professional" },
];

export default function FoundationModulePage() {
  const { moduleId } = useParams();
  const location = useLocation();
  const [mode, setMode] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const resolvedModuleId = moduleId || location.pathname.split("/").filter(Boolean).at(-1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!resolvedModuleId || resolvedModuleId === "foundation-stage") {
        setPayload(null);
        setError("Foundation module not found.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await getFoundationStageModuleById(resolvedModuleId, mode);
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Failed to load module.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [resolvedModuleId, mode]);

  return (
    <Container maxWidth="md" sx={{ mt: 3, pb: 10 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <AutoAwesome color="primary" />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Foundation Module
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Class 6-7 focused module content for structured progress.
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
                <InputLabel id="module-mode-label">Track</InputLabel>
                <Select
                  labelId="module-mode-label"
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

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip
              color={payload?.eligible ? "success" : "default"}
              label={payload?.eligible ? "Eligible" : "Not Eligible"}
            />
            <Chip variant="outlined" label={`Mode: ${mode}`} />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={payload?.eligible ? (mode === "professional" ? 80 : 45) : 0}
            sx={{ mt: 2, height: 8, borderRadius: 999 }}
          />
        </CardContent>
      </Card>

      {loading && <Alert severity="info">Loading module...</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && !payload?.eligible && (
        <Alert severity="warning">{payload?.availability?.reason}</Alert>
      )}

      {!loading && !error && payload?.eligible && payload?.module && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              {payload.module.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {payload.module.summary}
            </Typography>
            <Stack spacing={0.8}>
              {payload.module.delivery?.map((item) => (
                <Typography key={item} variant="body2">
                  • {item}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
