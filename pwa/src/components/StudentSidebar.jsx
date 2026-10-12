import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, IconButton } from "@mui/material";
import {
  FactCheck,
  Book,
  ReceiptLong,
  Quiz,
  Person,
  Close,
  Palette,
  Logout,
  School,
  Insights,
  Assessment,
  Interests,
  Psychology,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthProvider";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function StudentSidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const studentBase = location.pathname.startsWith("/students") ? "/students" : "/student";
  const menuItems = [
    { label: "Attendance", icon: <FactCheck />, path: `${studentBase}/attendance` },
    { label: "Diary", icon: <Book />, path: `${studentBase}/diary` },
    { label: "Report Cards", icon: <ReceiptLong />, path: `${studentBase}/report-cards` },
    { label: "Quiz", icon: <Quiz />, path: `${studentBase}/quiz` },
    { label: "Results", icon: <Assessment />, path: `${studentBase}/results` },
    { label: "Academic Domains", icon: <School />, path: `${studentBase}/academic-domains` },
    { label: "Personalized", icon: <Insights />, path: `${studentBase}/personalized` },
    { label: "MindScope", icon: <Psychology />, path: `${studentBase}/mindscope` },
    { label: "Hobbies", icon: <Interests />, path: `${studentBase}/hobbies` },
    { label: "Themes", icon: <Palette />, path: `${studentBase}/themes` },
    { label: "Profile", icon: <Person />, path: `${studentBase}/profile` },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          display: "flex",
          flexDirection: "column",
        }
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" fontWeight="bold">Menu</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>

      <Link to={`${studentBase}/profile`} onClick={onClose} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <Box sx={{ px: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={user?.avatar_url} sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
            {user?.name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">Student</Typography>
          </Box>
        </Box>
      </Link>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton onClick={() => handleNavigate(item.path)}>
              <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 1 }} />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>

      <Box sx={{ px: 2, pb: 2, pt: 1, display: "flex", justifyContent: "center" }}>
        <Box
          component="img"
          src="/xtown%20logo1.jpg"
          alt="xtown logo"
          sx={{ width: 120, maxWidth: "100%", height: "auto", objectFit: "contain" }}
        />
      </Box>
    </Drawer>
  );
}
