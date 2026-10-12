import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { 
  completeStudentProfileApi, 
  completeTeacherProfileApi, 
  updateParentProfileApi,
  needsProfileCompletion 
} from "../api/auth.api";

export function useProfileCompletion() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function completeProfile(profileData) {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error("User must be logged in to complete profile");
      }

      let response;
      
      // Call appropriate API based on user role
      switch (user.role) {
        case 'student':
          response = await completeStudentProfileApi(profileData);
          break;
        case 'teacher':
          response = await completeTeacherProfileApi(profileData);
          break;
        case 'parent':
          response = await updateParentProfileApi(profileData);
          break;
        default:
          throw new Error(`Profile completion not supported for role: ${user.role}`);
      }

      // If backend returns a new token (with updated first_login flag), use it
      if (response.token) {
        login(response.token);
      }

      return response;
    } catch (err) {
      const message = err.message || "Profile completion failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return {
    completeProfile,
    loading,
    error,
    clearError,
    needsCompletion: user ? needsProfileCompletion(user) : false,
  };
}