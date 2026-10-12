import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { needsProfileCompletion } from "../api/auth.api";

export default function RequireAuth({ children, requireProfileCompletion = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if profile completion is required
  if (requireProfileCompletion && needsProfileCompletion(user)) {
    const completionPath = user?.role === "parent" ? "/parent/profile" : "/first-login";
    if (location.pathname !== completionPath) {
      return <Navigate to={completionPath} state={{ from: location }} replace />;
    }
  }

  return children;
}
