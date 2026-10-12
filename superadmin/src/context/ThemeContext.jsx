import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider, createTheme, StyledEngineProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

export default function AppThemeProvider({ children }) {
    const [mode, setMode] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        localStorage.setItem("theme", mode);
        document.documentElement.setAttribute("data-theme", mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: '#6366f1',
                dark: '#4f46e5',
                light: '#818cf8',
            },
            secondary: {
                main: '#7c3aed',
            },
            background: {
                default: mode === 'light' ? '#f8fafc' : '#020617',
                paper: mode === 'light' ? '#ffffff' : '#0f172a',
            },
            text: {
                primary: mode === 'light' ? '#0f172a' : '#f1f5f9',
                secondary: mode === 'light' ? '#64748b' : '#94a3b8',
            },
            divider: mode === 'light' ? '#e2e8f0' : '#1e293b',
        },
        typography: {
            fontFamily: '"Inter", "Outfit", sans-serif',
            h1: { fontWeight: 900, letterSpacing: '-0.05em' },
            h2: { fontWeight: 800, letterSpacing: '-0.04em' },
            h3: { fontWeight: 800, letterSpacing: '-0.03em' },
            h4: { fontWeight: 700 },
            h5: { fontWeight: 700 },
            h6: { fontWeight: 700 },
            subtitle1: { fontWeight: 600 },
            subtitle2: { fontWeight: 600 },
            body1: { fontWeight: 500 },
            body2: { fontWeight: 500 },
            button: { fontWeight: 700, textTransform: 'none' },
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        padding: '8px 16px',
                        transition: 'all 0.2s ease',
                    },
                    contained: {
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transform: 'translateY(-1px)',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: mode === 'light'
                            ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)'
                            : '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
                        border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#1e293b'}`,
                    },
                },
            },
        },
    }), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {children}
                </ThemeProvider>
            </StyledEngineProvider>
        </ThemeContext.Provider>
    );
}
