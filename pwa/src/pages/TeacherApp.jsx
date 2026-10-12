import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { lazy, Suspense, useState, useEffect } from "react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import LoadingScreen from "../components/LoadingScreen";
import TeacherSidebar from "../components/TeacherSidebar";
import { ProtectedAppWrapper } from "./ProtectedAppWrapper";

/* lazy pages */
const DashboardPage = lazy(() => import("../modules/dashboard/DashboardPage"));
const ProfilePage = lazy(() => import("../modules/profile/ProfilePage"));
const TeacherTimetablePage = lazy(() => import("../modules/teacher-timetable/TeacherTimetablePage"));
const DiaryPage = lazy(() => import("../modules/diary/DiaryPage"));
const NotificationsPage = lazy(() => import("../modules/notifications/NotificationsPage"));
const GroupChatPage = lazy(() => import("../modules/group-chat/GroupChatPage"));
const GroupChatRoomPage = lazy(() => import("../modules/group-chat/GroupChatRoomPage"));
const ClassSessionPage = lazy(() => import("../modules/teacher-class-sessions/pages/ClassSessionPage"));
const ApprovalsPage = lazy(() => import("../modules/approvals/pages/ApprovalsPage"));
const ExamCreationPage = lazy(() => import("../modules/exams/pages/ExamCreationPage"));
const AssignedClassesPage = lazy(() => import("../modules/teacher-assignments/pages/AssignedClassesPage"));
const ReportCardEntryPage = lazy(() => import("../modules/report-card/pages/ReportCardEntryPage"));
const StudentsReportsPage = lazy(() => import("../modules/student-reports/pages/StudentsReportsPage"));
const TeacherAIToolsPage = lazy(() => import("../modules/ai-tools/TeacherAIToolsPage"));
const TeacherResultsPage = lazy(() => import("../modules/ai-tests/TeacherResultsPage"));
const ThemePage = lazy(() => import("../modules/theme/ThemePage"));

// Quiz pages
const QuizLobbyPage = lazy(() => import("../modules/quiz/pages/QuizLobbyPage"));
const QuizPlayPage = lazy(() => import("../modules/quiz/pages/QuizPlayPage"));
const QuizResultPage = lazy(() => import("../modules/quiz/pages/QuizResultPage"));

export default function TeacherApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen(true);
    window.addEventListener("toggle-teacher-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-teacher-sidebar", handleToggle);
  }, []);

  return (
    <ProtectedAppWrapper>
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <AppHeader />

        <TeacherSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <Box sx={{ flex: 1, pb: 7, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />

              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="timetable" element={<TeacherTimetablePage />} />
              <Route path="diary" element={<DiaryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />

              <Route path="class-sessions" element={<ClassSessionPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="exams/create" element={<ExamCreationPage />} />
              <Route path="assigned-classes" element={<AssignedClassesPage />} />
              <Route path="results" element={<TeacherResultsPage />} />
              <Route path="students-reports" element={<StudentsReportsPage />} />
              <Route path="report-cards/entry" element={<ReportCardEntryPage />} />
              <Route path="ai-tools" element={<TeacherAIToolsPage />} />
              <Route path="themes" element={<ThemePage />} />

              <Route path="group-chat" element={<GroupChatPage />} />
              <Route path="group-chat/:id" element={<GroupChatRoomPage />} />

              <Route path="quiz/:id/lobby" element={<QuizLobbyPage />} />
              <Route path="quiz/:id/play" element={<QuizPlayPage />} />
              <Route path="quiz/:id/results" element={<QuizResultPage />} />
            </Routes>
          </Suspense>
        </Box>

        <BottomNav />
      </Box>
    </ProtectedAppWrapper>
  );
}
