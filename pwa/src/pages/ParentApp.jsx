import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import { ProtectedAppWrapper } from "./ProtectedAppWrapper";
import ParentSidebar from "../components/ParentSidebar";
import { ParentChildProvider } from "../modules/parents/ParentChildContext";

/* pages */
import DashboardPage from "../modules/dashboard/DashboardPage";
import ProfilePage from "../modules/profile/ProfilePage";
import TimetablePage from "../modules/timetable/TimetablePage";
import AttendancePage from "../modules/attendance/AttendancePage";
import DiaryPage from "../modules/diary/DiaryPage";
import ParentPaymentsPage from "../modules/payments/ParentPaymentsPage";
import ParentAssignedTestsPage from "../modules/ai-tests/ParentAssignedTestsPage";
import NotificationsPage from "../modules/notifications/NotificationsPage";

export default function ParentApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen(true);
    window.addEventListener("toggle-parent-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-parent-sidebar", handleToggle);
  }, []);

  return (
    <ProtectedAppWrapper>
      <ParentChildProvider>
        <Box
          sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          <AppHeader />

          <ParentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <Box sx={{ flex: 1, pb: 7, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Routes>
              <Route index element={<Navigate to="/parent/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="results" element={<ParentAssignedTestsPage />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="diary" element={<DiaryPage />} />
              <Route path="payments" element={<ParentPaymentsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
            </Routes>
          </Box>

          <BottomNav />
        </Box>
      </ParentChildProvider>
    </ProtectedAppWrapper>
  );
}
