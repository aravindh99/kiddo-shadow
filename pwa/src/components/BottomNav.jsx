import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import {
  Home,
  CalendarMonth,
  Book,
  Chat,
  School,
  Person,
  Timer,
  SmartToy,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);
  useEffect(() => {
    setValue(location.pathname);
  }, [location.pathname]);

  if (!user) return null;

  const demoStudentRoute = location.pathname.startsWith("/students");
  const base =
    user.role === "student"
      ? demoStudentRoute
        ? "/students"
        : "/student"
      : user.role === "teacher"
        ? "/teacher"
        : "/parent";

  const navItems = {
    student: [
      { label: "Home", icon: <Home />, path: `${base}/dashboard` },
      { label: "Timetable", icon: <CalendarMonth />, path: `${base}/timetable` },
      { label: "AI", icon: <SmartToy />, path: `${base}/ai-chat` },
      { label: "Chat", icon: <Chat />, path: `${base}/group-chat` },
      { label: "Profile", icon: <Person />, path: "SIDEBAR_STUDENT" }, // opens student sidebar
    ],
    teacher: [
      { label: "Home", icon: <Home />, path: `${base}/dashboard` },
      { label: "Classes", icon: <School />, path: `${base}/assigned-classes` },
      { label: "Sessions", icon: <Timer />, path: `${base}/class-sessions` },
      { label: "Chat", icon: <Chat />, path: `${base}/group-chat` },
      { label: "Profile", icon: <Person />, path: "SIDEBAR_TRIGGER" }, // Special path to handle click
    ],
    parent: [
      { label: "Home", icon: <Home />, path: `${base}/dashboard` },
      { label: "Timetable", icon: <CalendarMonth />, path: `${base}/timetable` },
      { label: "Diary", icon: <Book />, path: `${base}/diary` },
      { label: "Payments", icon: <AccountBalanceWallet />, path: `${base}/payments` },
      { label: "Profile", icon: <Person />, path: `${base}/profile` },
    ],
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
        zIndex: 1200,
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_, newValue) => {
          // Sidebar triggers are handled exclusively by onClick to avoid double dispatch
          if (newValue === "SIDEBAR_TRIGGER" || newValue === "SIDEBAR_STUDENT") {
            return;
          }
          setValue(newValue);
          navigate(newValue);
        }}
        showLabels
      >
        {navItems[user.role].map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            value={item.path}
            onClick={() => {
              if (item.path === "SIDEBAR_TRIGGER") {
                window.dispatchEvent(new Event("toggle-teacher-sidebar"));
              } else if (item.path === "SIDEBAR_STUDENT") {
                window.dispatchEvent(new Event("toggle-student-sidebar"));
              }
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
