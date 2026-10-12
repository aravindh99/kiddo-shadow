import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { loginApi } from "../../api/auth.api";

export function useLogin() {
  const { login, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear errors when component unmounts or user starts typing
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  async function handleLogin(credentials) {
    try {
      setLoading(true);
      setError(null);
      clearError?.();

      // Validate credentials before sending
      if (!credentials?.username?.trim()) {
        throw new Error("Username is required");
      }
      
      if (!credentials?.password?.trim()) {
        throw new Error("Password is required");
      }

      const data = await loginApi(credentials);
      const token = data?.token;

      if (!token) {
        throw new Error("Login failed: missing token in response");
      }

      // Login will validate the token and throw if invalid
      login(token);
      return true;
    } catch (err) {
      let message = "Login failed";
      
      // Handle different types of errors with user-friendly messages
      if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.response?.status) {
        switch (err.response.status) {
          case 401:
            message = "Invalid username or password";
            break;
          case 403:
            message = "Account is disabled or school is inactive";
            break;
          case 429:
            message = "Too many login attempts. Please try again later";
            break;
          case 500:
            message = "Server error. Please try again later";
            break;
          default:
            message = "Login failed. Please try again";
        }
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function clearLoginError() {
    setError(null);
    clearError?.();
  }

  return {
    handleLogin,
    loading,
    error,
    clearError: clearLoginError,
  };
}
