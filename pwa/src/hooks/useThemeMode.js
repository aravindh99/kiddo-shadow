import { useEffect, useState } from "react";
import { DEFAULT_THEME } from "../theme/themes";
import { updateThemeColor } from "../pwa/themeMeta";
import { themes } from "../theme/themes";

const STORAGE_KEY = "theme";

export function useThemeMode() {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // restore on boot
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && themes[saved]) {
      setTheme(saved);
    }
  }, []);

  // sync PWA chrome color
  useEffect(() => {
    const muiTheme = themes[theme];
    updateThemeColor(muiTheme.palette.primary.main);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleDark: () =>
      setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
}
