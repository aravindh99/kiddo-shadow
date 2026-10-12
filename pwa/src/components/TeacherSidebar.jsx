import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, IconButton } from "@mui/material";
import {
    School,
    Book,
    CalendarMonth,
    Assignment,
    Assessment,
    AutoAwesome,
    Close,
    Person,
    Palette,
    Logout,
    NotificationsActive,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

export default function TeacherSidebar({ open, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
        onClose();
    };

    const menuItems = [
        { label: "Assigned Classes", icon: <School />, path: "/teacher/assigned-classes" },
        { label: "Diary & Homework", icon: <Book />, path: "/teacher/diary" },
        { label: "Approvals", icon: <Assignment />, path: "/teacher/approvals" },
        { label: "Notifications", icon: <NotificationsActive />, path: "/teacher/notifications" },
        { label: "Results", icon: <Assessment />, path: "/teacher/results" },
        { label: "Students Reports", icon: <Assessment />, path: "/teacher/students-reports" },
        { label: "Exams & Reports", icon: <Assessment />, path: "/teacher/exams/create" }, // Redirects to creation for now
        { label: "AI Tools", icon: <AutoAwesome />, path: "/teacher/ai-tools" },
        { label: "Themes", icon: <Palette />, path: "/teacher/themes" },
        { label: "Profile", icon: <Person />, path: "/teacher/profile" },
    ];

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
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">Menu</Typography>
                <IconButton onClick={onClose}><Close /></IconButton>
            </Box>

            <Link to="/teacher/profile" onClick={onClose} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <Box sx={{ px: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar src={user?.avatar_url || ""} sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                        {user?.name?.[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{user?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Teacher</Typography>
                    </Box>
                </Box>
            </Link>

            <Divider />

            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.label} disablePadding>
                        <ListItemButton onClick={() => handleNavigate(item.path)}>
                            <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
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
                        <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
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
