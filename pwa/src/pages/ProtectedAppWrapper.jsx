import { useAuth } from "../auth/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedAppWrapper({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // If first login, redirect to profile completion page
  if (user && user.role !== "parent" && user.first_login) {
    const completionPath = "/first-login";
    // Already on the target page — skip redirect to prevent infinite loop
    if (location.pathname === completionPath || location.pathname.startsWith(completionPath)) {
      return children;
    }
    return <Navigate to={completionPath} state={{ from: location }} replace />;
  }

  return children;
}
