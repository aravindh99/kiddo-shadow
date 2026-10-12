import { Navigate } from "react-router-dom";
import {
  Box,
  Container,
  Stack,
  Typography,
  Chip,
  useTheme,
  Alert,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { 
  AutoAwesomeRounded,
  Close as CloseIcon,
  Home as HomeIcon,
  NotificationsActive as NotificationsIcon,
  Speed as SpeedIcon 
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthProvider";
import LoginForm from "../modules/login/LoginForm";
import { useEffect, useState, useContext } from "react";
import appIcon from "../assets/app-icon-192.png";
import { ThemeModeContext } from "../theme/ThemeProvider";
import { usePwaInstall } from "../pwa/usePwaInstall";
import { InstallMobile as InstallIcon } from "@mui/icons-material";

export default function Login() {
  const { user, loading, logout } = useAuth();
  const { mode, platformName, platformLogo } = useContext(ThemeModeContext);
  const { canInstall, isInstalled, install } = usePwaInstall();
  const isDark = mode === "dark";
  const [blocked, setBlocked] = useState(false);
  const [showPwaPopup, setShowPwaPopup] = useState(false);
  const hasKnownUnapprovedStatus = false;

  useEffect(() => {
    let intervalId;
    const checkPrompt = () => {
      if (canInstall && !isInstalled) {
        const lastDismissed = localStorage.getItem('kiddos_pwa_login_dismissed');
        const now = Date.now();
        if (!lastDismissed || now - parseInt(lastDismissed) >= 5 * 60 * 1000) {
          setShowPwaPopup(true);
        }
      } else {
        setShowPwaPopup(false);
      }
    };
    checkPrompt();
    intervalId = setInterval(checkPrompt, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [canInstall, isInstalled]);

  const handleDismissPwa = () => {
    setShowPwaPopup(false);
    localStorage.setItem('kiddos_pwa_login_dismissed', Date.now().toString());
  };

  useEffect(() => {
    if (!user?.role) return;
    const allowed = ["student", "teacher", "parent"];
    if (!allowed.includes(user.role)) {
      setBlocked(true);
      logout();
    }
  }, [user?.role, logout]);

  if (loading) return null;

  if (user) {
    if (user.role === "student") {
      if (user.first_login) return <Navigate to="/first-login" replace />;
      if (hasKnownUnapprovedStatus) {
        return <Navigate to="/approval-pending" replace />;
      }
      return <Navigate to="/student/dashboard" replace />;
    }
    if (user.role === "teacher") {
      if (user.first_login) return <Navigate to="/first-login" replace />;
      if (hasKnownUnapprovedStatus) {
        return <Navigate to="/approval-pending" replace />;
      }
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (user.role === "parent") {
      if (hasKnownUnapprovedStatus) {
        return <Navigate to="/approval-pending" replace />;
      }
      return <Navigate to="/parent/dashboard" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <Box
      sx={{
        height: "100dvh",
        width: "100vw",
        boxSizing: "border-box",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        overscrollBehavior: "none",
        px: { xs: 2, sm: 3 },
        fontFamily: '"Sora", "Baloo 2", "Trebuchet MS", sans-serif',
        background: isDark
          ? "radial-gradient(1000px circle at 10% 10%, rgba(30,41,59,0.65) 0%, transparent 45%), radial-gradient(900px circle at 90% 0%, rgba(14,116,144,0.45) 0%, transparent 55%), linear-gradient(180deg, #0a0f1f 0%, #111827 100%)"
          : "radial-gradient(1200px circle at 10% 10%, rgba(254, 240, 138, 0.55) 0%, transparent 45%), radial-gradient(900px circle at 90% 0%, rgba(186, 230, 253, 0.7) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        "@keyframes float": {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(14px)" },
          "100%": { transform: "translateY(0px)" },
        },
        "@keyframes fadeSlide": {
          "0%": { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes sweep": {
          "0%": { transform: "translateX(-20%)" },
          "50%": { transform: "translateX(20%)" },
          "100%": { transform: "translateX(-20%)" },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: isDark ? 0.25 : 0.35,
          backgroundImage:
            "linear-gradient(transparent 95%, rgba(148,163,184,0.25) 96%), linear-gradient(90deg, transparent 95%, rgba(148,163,184,0.25) 96%)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: -90,
          right: -70,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(135deg, rgba(14,165,233,0.6), rgba(16,185,129,0.55))"
            : "linear-gradient(135deg, rgba(14,165,233,0.9), rgba(16,185,129,0.9))",
          opacity: 0.55,
          filter: "blur(2px)",
          animation: "float 10s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -120,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(135deg, rgba(251,191,36,0.35), rgba(244,63,94,0.3))"
            : "linear-gradient(135deg, rgba(251,191,36,0.8), rgba(244,63,94,0.6))",
          opacity: 0.5,
          filter: "blur(6px)",
          animation: "float 12s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "35%",
          left: "-15%",
          width: "55%",
          height: "55%",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(34,197,94,0.25), transparent 60%)"
            : "radial-gradient(circle, rgba(74,222,128,0.45), transparent 65%)",
          opacity: 0.5,
          filter: "blur(10px)",
          animation: "sweep 16s ease-in-out infinite",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: { xs: 2, sm: 4, md: 8 },
            alignItems: "center",
          }}
        >
          <Box sx={{ animation: "fadeSlide 750ms ease-out" }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2.8,
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    background:
                      "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
                    boxShadow: isDark
                      ? "0 12px 30px rgba(14,165,233,0.35)"
                      : "0 14px 32px rgba(16,185,129,0.35)",
                  }}
                >
                  <Box
                    component="img"
                    src={`${appIcon}?v=${Date.now()}`}
                    alt={`${platformName} logo`}
                    sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'contain' }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: -0.6,
                      color: "text.primary",
                    }}
                  >
                    {platformName}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 500,
                    letterSpacing: -1,
                    lineHeight: 0.85,
                    color: "text.primary",
                  }}
                >
                  Learn, teach, and stay connected.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Chip
                  icon={<AutoAwesomeRounded fontSize="small" />}
                  label="Safe - Kid friendly - Secure"
                  sx={{
                    bgcolor: isDark
                      ? "rgba(14,165,233,0.18)"
                      : "rgba(14,165,233,0.12)",
                    color: "text.primary",
                    fontWeight: 600,
                  }}
                />
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              animation: "fadeSlide 900ms ease-out",
              animationDelay: "80ms",
              alignSelf: { xs: "stretch", md: "center" },
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "text.primary" }}
                >
                  Welcome back, Sign in
                </Typography>
              </Box>

              {blocked && (
                <Alert severity="warning">
                  This portal is only for students, teachers, and parents. Please use the admin panel.
                </Alert>
              )}

              <Box
                sx={{
                  p: 0,
                  transition: "transform 250ms ease, opacity 250ms ease",
                }}
              >
                <LoginForm />
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>

      <Dialog 
        open={showPwaPopup} 
        onClose={handleDismissPwa}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
            backgroundImage: isDark ? 'linear-gradient(to bottom right, #1e293b, #0f172a)' : 'linear-gradient(to bottom right, #ffffff, #f8fafc)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            maxWidth: 400,
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(8px)'
            }
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Install Kiddoshadow</Typography>
          <IconButton onClick={handleDismissPwa} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            Install the app for a faster and better learning experience.
          </Typography>
          <List sx={{ pt: 0 }}>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><HomeIcon sx={{ color: '#0ea5e9' }} /></ListItemIcon>
              <ListItemText primary="Faster access directly from your Home Screen" primaryTypographyProps={{ fontWeight: 600, variant: 'body2', color: 'text.primary' }} />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><NotificationsIcon sx={{ color: '#10b981' }} /></ListItemIcon>
              <ListItemText primary="Instant notifications and real-time updates" primaryTypographyProps={{ fontWeight: 600, variant: 'body2', color: 'text.primary' }} />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}><SpeedIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
              <ListItemText primary="Better performance and smoother experience even on slower networks." primaryTypographyProps={{ fontWeight: 600, variant: 'body2', color: 'text.primary' }} />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Button onClick={handleDismissPwa} sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Maybe Later
          </Button>
          <Button onClick={() => { install(); handleDismissPwa(); }} variant="contained" sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700, backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)' }}>
            Install Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
