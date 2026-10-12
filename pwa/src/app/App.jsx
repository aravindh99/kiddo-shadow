import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

import Login from "../pages/Login";
import StudentApp from "../pages/StudentApp";
import TeacherApp from "../pages/TeacherApp";
import ParentApp from "../pages/ParentApp";
import NotAuthorized from "../pages/NotAuthorized";

import RequireAuth from "../auth/RequireAuth";
import RequireRole from "../auth/RequireRole";

import { useOnlineStatus } from "../hooks/useOnlineStatus";
import OfflinePage from "../pages/OfflinePage";
import FirstLoginPage from "../pages/FirstLoginPage";
import ForceProfileCompletion from "../auth/ForceProfileCompletion";
import RequireApproval from "../auth/RequireApproval";
import ApprovalPending from "../pages/ApprovalPending";
import { useAuth } from "../auth/AuthProvider";
import PWAStatus from "../components/PWAStatus";

export default function App() {
  const online = useOnlineStatus();
  const { user } = useAuth();
  const location = useLocation();

  if (!online) return <OfflinePage />;

  const roleHomePath =
    user?.role === "student"
      ? "/student"
      : user?.role === "teacher"
        ? "/teacher"
        : user?.role === "parent"
          ? "/parent"
          : "/login";
  const roleDashboardPath = user?.role ? `/${user.role}/dashboard` : "/login";

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <PWAStatus />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Navigate to={roleDashboardPath} replace />} />
        <Route
          path="/students/*"
          element={
            <RequireAuth>
              <RequireRole roles={["student"]}>
                <RequireApproval>
                  <ForceProfileCompletion>
                    <StudentApp />
                  </ForceProfileCompletion>
                </RequireApproval>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={roleHomePath} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/first-login"
          element={
            <RequireAuth>
              <FirstLoginPage />
            </RequireAuth>
          }
        />

        <Route
          path="/approval-pending"
          element={
            <RequireAuth>
              <ApprovalPending />
            </RequireAuth>
          }
        />

        <Route
          path="/student/*"
          element={
            <RequireAuth>
              <RequireRole roles={["student"]}>
                <RequireApproval>
                  <ForceProfileCompletion>
                    <StudentApp />
                  </ForceProfileCompletion>
                </RequireApproval>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/teacher/*"
          element={
            <RequireAuth>
              <RequireRole roles={["teacher"]}>
                <RequireApproval>
                  <ForceProfileCompletion>
                    <TeacherApp />
                  </ForceProfileCompletion>
                </RequireApproval>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/parent/*"
          element={
            <RequireAuth>
              <RequireRole roles={["parent"]}>
                <RequireApproval>
                  <ForceProfileCompletion>
                    <ParentApp />
                  </ForceProfileCompletion>
                </RequireApproval>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/unauthorized"
          element={
            <RequireAuth>
              <NotAuthorized />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={
            <RequireAuth>
              <Navigate to={roleHomePath} replace />
            </RequireAuth>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
