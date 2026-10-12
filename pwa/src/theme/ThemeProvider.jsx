import { createContext, useMemo, useState, useEffect } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material";
import { buildTheme, AVAILABLE_THEMES, DEFAULT_THEME } from "./themes";
import { setThemeColor } from "../pwa/themeMeta";

export const ThemeModeContext = createContext(null);

export default function ThemeProvider({ children }) {
  const storedTheme = localStorage.getItem("theme");
  const storedCustomColor = localStorage.getItem("theme_custom_color");
  const initialTheme = AVAILABLE_THEMES.includes(storedTheme)
    ? storedTheme
    : storedTheme === "custom"
      ? "custom"
    : DEFAULT_THEME;
  const [mode, setMode] = useState(initialTheme);
  const [customColor, setCustomColor] = useState(storedCustomColor || "#4f46e5");

  const [platformName, setPlatformName] = useState(localStorage.getItem("platform_name") || "kiddoshadow");
  const [platformLogo, setPlatformLogo] = useState(localStorage.getItem("platform_logo") || "");

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3003/api";
    const ASSET_BASE_URL = API_BASE_URL.replace("/api", "");

    fetch(`${API_BASE_URL}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.platform_name) {
            setPlatformName(data.data.platform_name);
            localStorage.setItem("platform_name", data.data.platform_name);
          }
          if (data.data.global_logo) {
            const newLogoUrl = `${ASSET_BASE_URL}${data.data.global_logo}?v=${Date.now()}`;
            setPlatformLogo(newLogoUrl);
            localStorage.setItem("platform_logo", newLogoUrl);
          }
        }
      })
      .catch(err => console.error("Failed to fetch global settings", err));
  }, []);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (platformLogo) {
      link.href = platformLogo;
    } else {
      link.href = "/vite.svg";
    }
  }, [platformLogo]);

  const theme = useMemo(() => buildTheme(mode, customColor), [mode, customColor]);

  useEffect(() => {
    localStorage.setItem("theme", mode);
    if (mode === "custom") {
      localStorage.setItem("theme_custom_color", customColor);
    }
    setThemeColor(theme.palette.background.default);
  }, [mode, theme, customColor]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, themes: AVAILABLE_THEMES, customColor, setCustomColor, platformName, platformLogo }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
