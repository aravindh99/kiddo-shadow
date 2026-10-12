import { useState } from "react";
import { changePasswordApi } from "../api/auth.api";

export function usePasswordChange() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function changePassword(passwordData) {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validate input
      if (!passwordData.old_password?.trim()) {
        throw new Error("Current password is required");
      }

      if (!passwordData.new_password?.trim()) {
        throw new Error("New password is required");
      }

      if (passwordData.new_password.length < 6) {
        throw new Error("New at least 6 characters");
      }

      if (passwordData.old_password === passwordData.new_password) {
        throw new Error("New password must be different from current password");
      }

      const response = await changePasswordApi({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });

      setSuccess(true);
      return response;
    } catch (err) {
      const message = err.message || "Password change failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  function clearSuccess() {
    setSuccess(false);
  }

  function reset() {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }

  return {
    changePassword,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    reset,
  };
}