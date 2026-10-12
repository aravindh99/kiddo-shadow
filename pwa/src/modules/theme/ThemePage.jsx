import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { Check, Palette } from "@mui/icons-material";
import { useState } from "react";
import { useThemeMode } from "../../theme/useThemeMode";
import { themes as themeMap } from "../../theme/themes";

const titleCase = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function ThemePage() {
  const { mode, setMode, themes, customColor, setCustomColor } = useThemeMode();
  const [customOpen, setCustomOpen] = useState(false);

  const presets = themes.map((key) => {
    const preset = themeMap[key];
    const primary = preset?.palette?.primary?.main || "#4f46e5";
    const secondary = preset?.palette?.secondary?.main || preset?.palette?.primary?.dark || "#14b8a6";
    return {
      key,
      label: titleCase(key),
      gradient: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    };
  });

  const handleCustomPick = (color) => {
    setCustomColor(color);
    setMode("custom");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 3, pb: 10 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        App Theme
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the look & feel that works best for you. Stored locally per device.
      </Typography>

      <Grid container spacing={2}>
        {presets.map((preset) => {
          const isActive = mode === preset.key;
          return (
            <Grid item xs={6} key={preset.key}>
              <Paper
                onClick={() => setMode(preset.key)}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  cursor: "pointer",
                  border: isActive ? "2px solid" : "1px solid",
                  borderColor: isActive ? "primary.main" : "divider",
                  boxShadow: isActive ? "0 6px 18px rgba(0,0,0,0.12)" : "none",
                }}
              >
                <Box
                  sx={{
                    height: 64,
                    borderRadius: 2,
                    background: preset.gradient,
                    mb: 1.5,
                  }}
                />
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" fontWeight={600}>
                    {preset.label}
                  </Typography>
                  {isActive && <Check fontSize="small" color="primary" />}
                </Stack>
              </Paper>
            </Grid>
          );
        })}

        <Grid item xs={12}>
          <Paper
            onClick={() => setCustomOpen(true)}
            sx={{
              p: 2,
              borderRadius: 3,
              cursor: "pointer",
              border: mode === "custom" ? "2px solid" : "1px dashed",
              borderColor: mode === "custom" ? "primary.main" : "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: customColor,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Custom color
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pick your own accent
                </Typography>
              </Box>
            </Stack>
            <Palette color="action" />
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={customOpen} onClose={() => setCustomOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Choose a custom color</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Theme color"
              type="color"
              value={customColor}
              onChange={(e) => handleCustomPick(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hex value"
              value={customColor}
              onChange={(e) => handleCustomPick(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => setCustomOpen(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
