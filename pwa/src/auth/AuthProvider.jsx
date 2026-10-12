import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { setupAxiosInterceptors } from "../api/axios.interceptors";
import { validateToken, logoutApi } from "../api/auth.api";
import { getMyProfile } from "../modules/profile/profile.api";

const AuthContext = createContext(null);
const SUPPORTED_ROLES = ["student", "teacher", "parent"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------- helpers ----------
  function decodeToken(jwt) {
    try {
      return jwtDecode(jwt);
    } catch {
      return null;
    }
  }

  function isTokenExpired(decoded) {
    if (!decoded?.exp) return true;
    return decoded.exp * 1000 < Date.now();
  }

  // ---------- bootstrap (restore session) ----------
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Validate token before using it
    if (!validateToken(storedToken)) {
      console.warn("Stored token is invalid, clearing session");
      localStorage.removeItem("token");
      setLoading(false);
      return;
    }

    const decoded = decodeToken(storedToken);

    if (!decoded || isTokenExpired(decoded)) {
      console.warn("Stored token is expired, clearing session");
      localStorage.removeItem("token");
      setLoading(false);
      return;
    }

    if (!SUPPORTED_ROLES.includes(decoded.role)) {
      console.warn("Unsupported role for this app, clearing session");
      localStorage.removeItem("token");
      setLoading(false);
      return;
    }

    setToken(storedToken);
    setUser(decoded);
    setLoading(false);
  }, []);

  // ---------- axios interceptors (ONCE) ----------
  useEffect(() => {
    setupAxiosInterceptors({
      onLogout: logout,
      onTokenRefresh: (newToken) => {
        // Future implementation for token refresh
        if (newToken && validateToken(newToken)) {
          const decoded = decodeToken(newToken);
          if (decoded && !isTokenExpired(decoded)) {
            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser(decoded);
          }
        }
      },
    });
  }, []);

  // ---------- hydrate user profile (name/avatar) ----------
  useEffect(() => {
    if (!token || !user?.role) return;

    let cancelled = false;

    async function fetchProfile() {
      try {
        if (!SUPPORTED_ROLES.includes(user.role)) return;
        const res = await getMyProfile(user.role);

        const data = res.data;
        const normalized = data?.user ? { ...data, ...data.user } : data;
        const avatarUrl =
          normalized?.avatar_url ||
          normalized?.avatar ||
          "";

        if (!cancelled) {
          setUser((prev) => ({
            ...prev,
            name: normalized?.name ?? prev?.name,
            phone: normalized?.phone ?? prev?.phone,
            email: normalized?.email ?? prev?.email,
            class_id: normalized?.class_id ?? prev?.class_id,
            section_id: normalized?.section_id ?? prev?.section_id,
            class_name:
              normalized?.class?.class_name ??
              normalized?.Class?.class_name ??
              prev?.class_name,
            section_name:
              normalized?.section?.name ??
              normalized?.Section?.name ??
              prev?.section_name,
            avatar_url: avatarUrl || prev?.avatar_url || "",
            first_login:
              normalized?.first_login === true || normalized?.user?.first_login === true
                ? true
                : false,
            approval_status: normalized?.approval_status ?? prev?.approval_status,
          }));
        }
      } catch (err) {
        const status = err?.response?.status;
        if (
          status === 403 ||
          (status === 404 && user?.role === "teacher")
        ) {
          await logout();
          return;
        }

        if (import.meta.env.DEV) {
          console.warn("Profile hydrate failed:", err?.message || err);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [token, user?.role]);

  // ---------- actions ----------
  function login(jwt) {
    try {
      setError(null);
      
      if (!jwt) {
        throw new Error("No token provided");
      }

      if (!validateToken(jwt)) {
        throw new Error("Invalid token format");
      }

      const decoded = decodeToken(jwt);

      if (!decoded || isTokenExpired(decoded)) {
        throw new Error("Token is expired");
      }


      // Validate required fields
      if (!decoded.id || !decoded.role) {
        throw new Error("Token missing required fields");
      }

      if (!SUPPORTED_ROLES.includes(decoded.role)) {
        throw new Error(
          "Invalid Username or Password"
        );
      }

      localStorage.setItem("token", jwt);
      setToken(jwt);
      setUser(decoded);


      // Validate required fields
      if (!decoded.id || !decoded.role) {
        throw new Error("Token missing required fields");
      }

      if (!SUPPORTED_ROLES.includes(decoded.role)) {
        throw new Error("Invalid username or password.");
      }

      localStorage.setItem("token", jwt);
      setToken(jwt);
      setUser(decoded);


      return decoded;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      setError(null);
      
      // Call logout API if available
      await logoutApi();
    } catch (error) {
      console.warn("Logout API call failed:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local state
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  }

  // Token refresh function (for future use)
  async function refreshToken() {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken || !validateToken(currentToken)) {
        throw new Error("No valid token to refresh");
      }

      // TODO: Implement when backend adds refresh endpoint
      // const response = await refreshTokenApi(currentToken);
      // return login(response.token);
      
      // For now, just validate current token
      const decoded = decodeToken(currentToken);
      if (decoded && !isTokenExpired(decoded)) {
        return decoded;
      } else {
        throw new Error("Token expired");
      }
    } catch (error) {
      setError(error.message);
      logout();
      throw error;
    }
  }

  const value = {
    user,                   // decoded JWT payload
    token,                  // raw token
    isAuthenticated: !!user,
    loading,
    error,
    updateUser: (partial) =>
      setUser((prev) => (prev ? { ...prev, ...partial } : partial)),
    login,
    logout,
    refreshToken,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- hook ----------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
