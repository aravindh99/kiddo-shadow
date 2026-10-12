import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import { lazy, Suspense, useState, useEffect } from "react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import LoadingScreen from "../components/LoadingScreen";
import { ProtectedAppWrapper } from "./ProtectedAppWrapper";
import StudentSidebar from "../components/StudentSidebar";
import StudentTestLockGate from "../modules/ai-tests/StudentTestLockGate";

/* lazy pages */
const DashboardPage = lazy(() =>
  import("../modules/dashboard/DashboardPage")
);
const ProfilePage = lazy(() =>
  import("../modules/profile/ProfilePage")
);
const TimetablePage = lazy(() =>
  import("../modules/timetable/TimetablePage")
);
const AttendancePage = lazy(() =>
  import("../modules/attendance/AttendancePage")
);
const DiaryPage = lazy(() =>
  import("../modules/diary/DiaryPage")
);
const NotificationsPage = lazy(() =>
  import("../modules/notifications/NotificationsPage")
);
const ReportCardPage = lazy(() =>
  import("../modules/report-card/ReportCardPage")
);
const ReportCardsList = lazy(() =>
  import("../modules/report-card/ReportCardsList")
);
const GroupChatPage = lazy(() =>
  import("../modules/group-chat/GroupChatPage")
);
const GroupChatRoomPage = lazy(() =>
  import("../modules/group-chat/GroupChatRoomPage")
);
const AiChatPage = lazy(() =>
  import("../modules/ai-chat/pages/AiChatPage")
);
const VoiceChatPage = lazy(() =>
  import("../modules/voice-chat/pages/VoiceChatPage")
);
const QuizLandingPage = lazy(() =>
  import("../modules/quiz/pages/QuizLandingPage")
);
const SinglePlayerQuizPage = lazy(() =>
  import("../modules/quiz/pages/SinglePlayerQuizPage")
);
const QuizLobbyPage = lazy(() =>
  import("../modules/quiz/pages/QuizLobbyPage")
);
const QuizPlayPage = lazy(() =>
  import("../modules/quiz/pages/QuizPlayPage")
);
const QuizResultPage = lazy(() =>
  import("../modules/quiz/pages/QuizResultPage")
);
const ThemePage = lazy(() =>
  import("../modules/theme/ThemePage")
);
const AcademicDomainsPage = lazy(() =>
  import("../modules/academic-domains/AcademicDomainsPage")
);
const PersonalizedInsightsPage = lazy(() =>
  import("../modules/personalized/PersonalizedInsightsPage")
);
const StudentVisualTutorPage = lazy(() =>
  import("../modules/visual-tutor/StudentVisualTutorPage")
);
const MindScopePage = lazy(() =>
  import("../modules/mindscope/pages/MindScopePage")
);
const FoundationStagePage = lazy(() =>
  import("../modules/foundation-stage/FoundationStagePage")
);
const FoundationModulePage = lazy(() =>
  import("../modules/foundation-stage/FoundationModulePage")
);
const LearningModuleIntroPage = lazy(() =>
  import("../modules/learning-analytics/LearningModuleIntroPage")
);
const HobbiesPage = lazy(() =>
  import("../modules/learning-analytics/HobbiesPage")
);
const HobbiesSelectedPage = lazy(() =>
  import("../modules/learning-analytics/HobbiesSelectedPage")
);
const StudentAssignedTestsPage = lazy(() =>
  import("../modules/ai-tests/StudentAssignedTestsPage")
);
const StudentAssignedTestDetailPage = lazy(() =>
  import("../modules/ai-tests/StudentAssignedTestDetailPage")
);
const StudentResultsPage = lazy(() =>
  import("../modules/ai-tests/StudentResultsPage")
);

export default function StudentApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAiChatRoute = /\/ai-chat(?:\/|$)/.test(location.pathname);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen(true);
    window.addEventListener("toggle-student-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-student-sidebar", handleToggle);
  }, []);

  return (
    <ProtectedAppWrapper>
      <Box
        sx={{
          minHeight: "100vh",
          height: isAiChatRoute ? "100dvh" : "auto",
          display: "flex",
          flexDirection: "column",
          bgcolor: isAiChatRoute ? "#ffffff" : "background.default",
          overflow: isAiChatRoute ? "hidden" : "visible",
        }}
      >
        <AppHeader />

        <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <StudentTestLockGate />

        <Box
          sx={{
            flex: 1,
            pb: isAiChatRoute ? 0 : 7,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            bgcolor: isAiChatRoute ? "#ffffff" : "transparent",
            overflow: isAiChatRoute ? "hidden" : "visible",
          }}
        >
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />

              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="diary" element={<DiaryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="report-cards" element={<ReportCardsList />} />
              <Route path="report-cards/:id" element={<ReportCardPage />} />

              <Route path="group-chat" element={<GroupChatPage />} />
              <Route path="group-chat/:id" element={<GroupChatRoomPage />} />

              <Route path="ai-chat" element={<AiChatPage />} />
              <Route path="voice-chat" element={<VoiceChatPage />} />

              <Route path="quiz" element={<QuizLandingPage />} />
              <Route path="quiz/single" element={<SinglePlayerQuizPage />} />
              <Route path="quiz/:id/lobby" element={<QuizLobbyPage />} />
              <Route path="quiz/:id/play" element={<QuizPlayPage />} />
              <Route path="quiz/:id/results" element={<QuizResultPage />} />
              <Route path="ai-tests" element={<StudentAssignedTestsPage />} />
              <Route path="ai-tests/:id" element={<StudentAssignedTestDetailPage />} />
              <Route path="results" element={<StudentResultsPage />} />
              <Route path="academic-domains" element={<AcademicDomainsPage />} />
              <Route path="personalized" element={<PersonalizedInsightsPage />} />
              <Route path="visual-tutor" element={<StudentVisualTutorPage />} />
              <Route path="mindscope" element={<MindScopePage />} />
              <Route path="hobbies" element={<HobbiesPage />} />
              <Route path="hobbies/selected" element={<HobbiesSelectedPage />} />
              <Route path="foundation-stage" element={<FoundationStagePage />} />
              <Route path="foundation-stage/:moduleId" element={<FoundationModulePage />} />
              <Route path="learning-analytics/:moduleId" element={<LearningModuleIntroPage />} />
              <Route path="themes" element={<ThemePage />} />
            </Routes>
          </Suspense>
        </Box>

        <BottomNav />
      </Box>
    </ProtectedAppWrapper>
  );
}
