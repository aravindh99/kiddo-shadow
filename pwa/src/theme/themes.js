import { createTheme } from "@mui/material/styles";
import { tokens } from "./tokens";

const fontFamily = "'Inter', 'SF Pro Text', 'Segoe UI', system-ui, -apple-system, sans-serif";

const base = {
  shape: {
    borderRadius: tokens.radius.md,
  },
  typography: {
    fontFamily,
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
};

export const themes = {
  light: createTheme({
    ...base,
    palette: {
      mode: "light",
      primary: { main: "#4f46e5" },
      secondary: { main: "#14b8a6" },
      background: {
        default: "#f5f6fb",
        paper: "#ffffff",
      },
      text: {
        primary: "#0f172a",
        secondary: "#475569",
      },
    },
  }),

  amber: createTheme({
    ...base,
    palette: {
      mode: "light",
      primary: { main: "#f59e0b" },
      secondary: { main: "#14b8a6" },
      background: {
        default: "#fff7ed",
        paper: "#ffffff",
      },
      text: {
        primary: "#451a03",
        secondary: "#92400e",
      },
    },
  }),

  forest: createTheme({
    ...base,
    palette: {
      mode: "light",
      primary: { main: "#0f766e" },
      secondary: { main: "#f97316" },
      background: {
        default: "#ecfdf3",
        paper: "#ffffff",
      },
      text: {
        primary: "#0f172a",
        secondary: "#475569",
      },
    },
  }),

  ocean: createTheme({
    ...base,
    palette: {
      mode: "light",
      primary: { main: "#0ea5e9" },
      secondary: { main: "#6366f1" },
      background: {
        default: "#f0f9ff",
        paper: "#ffffff",
      },
      text: {
        primary: "#0f172a",
        secondary: "#475569",
      },
    },
  }),

  rose: createTheme({
    ...base,
    palette: {
      mode: "light",
      primary: { main: "#f43f5e" },
      secondary: { main: "#8b5cf6" },
      background: {
        default: "#fff1f2",
        paper: "#ffffff",
      },
      text: {
        primary: "#1f2937",
        secondary: "#6b7280",
      },
    },
  }),
};

export const AVAILABLE_THEMES = Object.keys(themes);
export const DEFAULT_THEME = "light";

function buildCustomTheme(primaryColor) {
  return createTheme({
    ...base,
    palette: {
      mode: "light",
      primary: { main: primaryColor || themes[DEFAULT_THEME].palette.primary.main },
      secondary: { main: "#14b8a6" },
      background: {
        default: "#f5f6fb",
        paper: "#ffffff",
      },
      text: {
        primary: "#0f172a",
        secondary: "#475569",
      },
    },
  });
}

export function buildTheme(mode, customColor) {
  if (mode === "custom") return buildCustomTheme(customColor);
  return themes[mode] || themes[DEFAULT_THEME];
}
