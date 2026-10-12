import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { getMyProfile } from "../modules/profile/profile.api";

const APPROVAL_ROLES = ["teacher", "student", "parent"];

export default function RequireApproval({ children }) {
  const { user, loading, updateUser, token } = useAuth();
  const location = useLocation();
  const [profileGate, setProfileGate] = useState({
    firstLogin: null,
    approvalStatus: null,
  });
  const [checking, setChecking] = useState(true);

  const shouldCheck = useMemo(() => {
    return user?.role && APPROVAL_ROLES.includes(user.role);
  }, [user?.role]);

  const completionPath = "/first-login";
  const isOnCompletionPath =
    location.pathname === completionPath ||
    location.pathname.startsWith(`${completionPath}/`);
  const isParentProfileRoute = location.pathname === "/parent/profile";

  useEffect(() => {
    let isMounted = true;

    async function fetchApprovalStatus() {
      if (!shouldCheck) {
        if (isMounted) setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const res = await getMyProfile(user.role);
        const data = res?.data || {};
        // Normalize: approval_status may be at top level OR inside data.user (parent profile shape)
        const normalized = data?.user ? { ...data, ...data.user } : data;
        const approvalStatus = normalized?.approval_status || null;
        const firstLogin =
          data?.first_login === true || data?.user?.first_login === true;

        if (isMounted) {
          setProfileGate({
            firstLogin,
            approvalStatus,
          });
          updateUser?.({
            ...(typeof firstLogin === "boolean" ? { first_login: firstLogin } : {}),
            ...(approvalStatus ? { approval_status: approvalStatus } : {}),
            ...(normalized?.name ? { name: normalized.name } : {}),
          });
        }
      } catch (err) {
        console.error("Failed to fetch approval status:", err);
        if (isMounted) {
          setProfileGate({
            firstLogin: user?.first_login ?? null,
            approvalStatus: user?.approval_status ?? null,
          });
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    fetchApprovalStatus();

    return () => {
      isMounted = false;
    };
  }, [shouldCheck, user?.role, token]);

  if (loading || checking) return null;
  if (!shouldCheck) return children;

  const currentFirstLogin = user?.first_login ?? profileGate.firstLogin;
  const currentApprovalStatus = user?.approval_status ?? profileGate.approvalStatus;

  // 1. Enforce profile completion FIRST
  if (currentFirstLogin === true) {
    if (user?.role === "parent") {
      if (!isParentProfileRoute) {
        return <Navigate to="/parent/profile" state={{ from: location }} replace />;
      }
      return children;
    } else {
      if (!isOnCompletionPath) {
        return <Navigate to={completionPath} state={{ from: location }} replace />;
      }
      return children;
    }
  }

  // 2. If profile is completed, enforce admin approval
  if (currentApprovalStatus !== null && currentApprovalStatus !== "approved") {
    const isApprovalRoute = location.pathname.startsWith("/approval-pending");
    
    // If not approved, they must be on the approval pending page
    if (!isApprovalRoute) {
      return (
        <Navigate to="/approval-pending" state={{ from: location }} replace />
      );
    }
    return children;
  }

  return children;
}
