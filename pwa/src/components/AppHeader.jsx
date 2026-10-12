import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Popover,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  ListItemIcon,
} from "@mui/material";
import { Notifications, Check } from "@mui/icons-material";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "../modules/notifications/useNotifications";

export default function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, acknowledge } = useNotifications();
  const unreadItems = items?.filter?.((n) => !n.is_acknowledged) || [];
  const unreadCount = unreadItems.length;
  const demoStudentRoute = location.pathname.startsWith("/students");

  const [anchorEl, setAnchorEl] = useState(null);

  const basePath =
    user?.role === "student"
      ? demoStudentRoute
        ? "/students"
        : "/student"
      : user?.role === "teacher"
        ? "/teacher"
        : "/parent";

  function handleProfileClick() {
    if (!user) return;
    if (user.role === "teacher") {
      window.dispatchEvent(new Event("toggle-teacher-sidebar"));
      return;
    }
    if (user.role === "student") {
      window.dispatchEvent(new Event("toggle-student-sidebar"));
      return;
    }
    if (user.role === "parent") {
      window.dispatchEvent(new Event("toggle-parent-sidebar"));
      return;
    }
    navigate(`${basePath}/profile`);
  }

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClearAll = async () => {
    if (unreadItems.length > 0) {
      await Promise.all(unreadItems.map(item => acknowledge(item.id)));
    }
    handleClose();
  };

  const handleSeeAll = () => {
    navigate(`${basePath}/notifications`);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ display: "flex", gap: 2 }}>
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
          kiddoshadow
        </Typography>
        {user && (
          <>
            <IconButton
              size="small"
              onClick={handleNotificationClick}
              sx={{ mr: 1, color: "text.primary" }}
              aria-label="Notifications"
            >
              <Badge color="error" badgeContent={unreadCount} overlap="circular">
                <Notifications />
              </Badge>
            </IconButton>

            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: { 
                    width: { xs: 320, sm: 360 }, 
                    maxWidth: '95vw', 
                    mt: 1, 
                    borderRadius: 2, 
                    boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.2)' 
                }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                  NOTIFICATIONS
                </Typography>
                {unreadCount > 0 && (
                  <Button size="small" color="error" sx={{ fontSize: '0.7rem', fontWeight: 600 }} onClick={handleClearAll}>
                    CLEAR ALL
                  </Button>
                )}
              </Box>
              <Divider />
              <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                {unreadItems.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      You are all caught up!
                    </Typography>
                  </Box>
                ) : (
                  unreadItems.slice(0, 5).map((item) => (
                    <ListItem 
                      key={item.id} 
                      divider 
                      sx={{ alignItems: 'flex-start', py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' } }}
                      onClick={async () => {
                         try {
                             await acknowledge(item.id);
                         } catch (e) {
                             console.error("Ack failed", e);
                         }
                         
                         let targetPath = `${basePath}/notifications`;
                         const cat = item.category || "";
                         const title = item.title?.toLowerCase() || "";

                         if (cat === "Homework" || cat === "Diary" || title.includes("homework") || title.includes("diary")) {
                             targetPath = `${basePath}/diary`;
                         } else if (cat === "Attendance" || title.includes("attendance")) {
                             targetPath = `${basePath}/attendance`;
                         } else if (cat === "Profile Update" || cat === "Leave" || title.includes("approval") || title.includes("registration") || title.includes("profile")) {
                             targetPath = `${basePath}/approvals`;
                         } else if (cat === "Exam" || cat === "Results" || title.includes("exam") || title.includes("result")) {
                             targetPath = `${basePath}/results`;
                         } else if (cat === "Fees" || title.includes("fee")) {
                             targetPath = `${basePath}/fees`;
                         }
                         
                         navigate(targetPath);
                         handleClose();
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <Check sx={{ fontSize: 14, color: '#64748b' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight={600} color="#1e293b" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                            {item.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5, lineHeight: 1.3 }}>
                              {item.message?.length > 60 ? `${item.message.substring(0, 60)}...` : item.message}
                            </Typography>
                            <Typography variant="caption" color="#94a3b8">
                              {new Date(item.createdAt || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button fullWidth variant="text" size="small" sx={{ fontWeight: 600, color: 'primary.main' }} onClick={handleSeeAll}>
                   SEE ALL
                </Button>
              </Box>
            </Popover>

            <IconButton
              size="small"
              onClick={handleProfileClick}
              sx={{
                p: 0,
                mr: 1,
              }}
              aria-label="Open profile"
            >
              <Avatar
                src={user?.avatar_url || ""}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: 14,
                }}
              >
                {user.name?.[0]?.toUpperCase() ||
                  user.role?.[0]?.toUpperCase() ||
                  "U"}
              </Avatar>
            </IconButton>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
