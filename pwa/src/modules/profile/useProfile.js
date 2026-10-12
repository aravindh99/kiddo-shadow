import { useEffect, useState } from "react";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from "./profile.api";
import { useAuth } from "../../auth/AuthProvider";
import { getErrorMessage } from "../../utils/apiErrorHandler";

export function useProfile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.role) return;
    fetchProfile();
  }, [user?.role]);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError(null);

      const res = await getMyProfile(user.role);
      const data = res.data;
      const normalized = data?.user ? { ...data, ...data.user } : data;
      const avatarUrl =
        normalized?.avatar_url ||
        normalized?.avatar ||
        "";
      const linkedStudent =
        normalized?.student ||
        normalized?.Student ||
        null;
      setProfile({
        role: user.role,
        name: "",
        phone: "",
        avatar_url: "",
        student: linkedStudent,
        class:
          linkedStudent?.class ||
          linkedStudent?.Class ||
          null,
        section:
          linkedStudent?.section ||
          linkedStudent?.Section ||
          null,
        ...normalized,
      });

      updateUser({
        name: normalized?.name ?? user?.name,
        phone: normalized?.phone ?? user?.phone,
        email: normalized?.email ?? user?.email,
        avatar_url: avatarUrl,
        first_login:
          normalized?.first_login === true || normalized?.user?.first_login === true
            ? true
            : false,
        ...(normalized?.approval_status
          ? { approval_status: normalized.approval_status }
          : {}),
      });
    } catch (err) {
      const message = getErrorMessage(err) || "Failed to load profile";
      setError(message);
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(data) {
    try {
      setSaving(true);
      setError(null);

      await updateMyProfile(user.role, data);
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      const message = getErrorMessage(err) || "Failed to update profile";
      setError(message);
      console.error("Profile save error:", err);
      throw err; // Re-throw so UI can handle it
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file) {
    try {
      setUploading(true);
      setError(null);

      if (!file) {
        throw new Error("No file provided");
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum size: 10MB");
      }

      // Delete old avatar if exists
      if (profile?.avatar_url && profile.avatar_url.startsWith('http')) {
        try {
          await deleteProfilePicture(profile.avatar_url);
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar
      const avatarUrl = await uploadProfilePicture(file, user.id);
      updateUser({ avatar_url: avatarUrl });

      return avatarUrl;
    } catch (err) {
      const message = err.message || "Avatar upload failed";
      setError(message);
      console.error("Avatar upload error:", err);
      throw err; // Re-throw so UI can handle it
    } finally {
      setUploading(false);
    }
  }

  async function deleteAvatar() {
    try {
      setUploading(true);
      setError(null);

      if (profile?.avatar_url && profile.avatar_url.startsWith('http')) {
        await deleteProfilePicture(profile.avatar_url);
      }

      // ProfileForm.jsx will handle saving the full profile payload
      return true;
    } catch (err) {
      const message = err.message || "Avatar deletion failed";
      setError(message);
      console.error("Avatar delete error:", err);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return {
    profile,
    loading,
    saving,
    uploading,
    error,
    saveProfile,
    uploadAvatar,
    deleteAvatar,
    clearError,
    refetch: fetchProfile,
  };
}
