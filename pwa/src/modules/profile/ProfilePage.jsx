import {
  Container,
  Paper,
  CircularProgress,
  Alert,
  Typography,
  TextField,
  Stack,
  Button,
  Snackbar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ProfileForm from "./ProfileForm";
import { useProfile } from "./useProfile";
import { useProfileCompletion } from "../../auth/useProfileCompletion"; // Imported
import { useState, useEffect } from "react";
import { changePasswordApi } from "../../api/auth.api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { Close, Visibility, VisibilityOff } from "@mui/icons-material";
import { useParentChild } from "../parents/ParentChildContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const { selectedChild } = useParentChild();
  const navigate = useNavigate();
  const {
    profile,
    loading,
    error,
    saveProfile,
    uploadAvatar,
    deleteAvatar,
    saving,
    uploading,
    clearError,
  } = useProfile();

  const { needsCompletion } = useProfileCompletion(); // Get completion status

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const basePath =
    user?.role === "student"
      ? "/student"
      : user?.role === "teacher"
        ? "/teacher"
        : user?.role === "parent"
          ? "/parent"
          : "";

  const requiresApproval = user?.role === "student" || user?.role === "parent" || user?.role === "teacher";

  useEffect(() => {
    if (
      user?.approval_status === "approved" &&
      localStorage.getItem("profile_update_pending") === "true"
    ) {
      localStorage.removeItem("profile_update_pending");
    }
  }, [user?.approval_status]);

  async function handleProfileSubmit(data) {
    try {
      await saveProfile(data);
      if (requiresApproval) {
        localStorage.setItem("profile_update_pending", "true");
      }
      setSaveSuccess(true);
      if (requiresApproval) {
        navigate("/approval-pending", { replace: true });
      }
    } catch (err) {
      // Errors are handled by the hook and shown via error state.
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!oldPassword || !newPassword) {
      setPwError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters long.");
      return;
    }

    try {
      setPwLoading(true);
      await changePasswordApi({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwSuccess("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to update password.";
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  }

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading profile...
        </Typography>
      </Container>
    );
  }

  const effectiveProfile =
    user?.role === "parent" && selectedChild
      ? {
          ...profile,
          student: {
            ...(profile?.student || {}),
            ...(selectedChild.raw?.student || {}),
          },
          class: selectedChild.className
            ? { ...(profile?.class || {}), class_name: selectedChild.className, id: selectedChild.classId }
            : profile?.class,
          section: selectedChild.sectionName
            ? { ...(profile?.section || {}), name: selectedChild.sectionName, id: selectedChild.sectionId }
            : profile?.section,
        }
      : profile;

  return (
    <Container maxWidth="sm" sx={{ mt: 4, pb: 4 }}>
      <Snackbar
        open={saveSuccess}
        autoHideDuration={2000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSaveSuccess(false)} sx={{ width: "100%" }}>
          {requiresApproval
            ? "Your profile update request has been submitted successfully and is awaiting admin approval."
            : "Profile saved successfully."}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {profile && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {needsCompletion ? "Complete Your Profile" : "Profile Information"}
            </Typography>
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              aria-label="Close"
            >
              <Close />
            </IconButton>
          </Stack>
          <ProfileForm
            profile={effectiveProfile}
            onSave={saveProfile}
            onSubmit={handleProfileSubmit}
            onAvatarUpload={uploadAvatar}
            onAvatarDelete={deleteAvatar}
            saving={saving}
            uploading={uploading}
            error={error}
            onClearError={clearError}
            isCompleting={needsCompletion}
          />
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Change Password
        </Typography>

        {pwError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPwError("")}>
            {pwError}
          </Alert>
        )}
        {pwSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPwSuccess("")}>
            {pwSuccess}
          </Alert>
        )}

        <Stack
          component="form"
          spacing={2}
          onSubmit={handleChangePassword}
        >
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={user?.username || profile?.email || profile?.phone || profile?.name || ""}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              height: 0,
              width: 0,
              border: 0,
              padding: 0,
            }}
          />
          <TextField
            label="Current Password"
            type={showOldPassword ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            fullWidth
            autoComplete="current-password"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle current password visibility"
                    onClick={() => setShowOldPassword((show) => !show)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            autoComplete="new-password"
            helperText="Minimum 6 characters"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle new password visibility"
                    onClick={() => setShowNewPassword((show) => !show)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            autoComplete="new-password"
            error={newPassword !== confirmPassword && confirmPassword.length > 0}
            helperText={
              newPassword !== confirmPassword && confirmPassword.length > 0
                ? "Passwords do not match"
                : ""
            }
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword((show) => !show)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={pwLoading || !oldPassword || !newPassword || !confirmPassword}
          >
            {pwLoading ? "Updating..." : "Update Password"}
          </Button>
        </Stack>
      </Paper>
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        message="Profile updated successfully."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={clearError}
        message="Failed to update profile. Please try again."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
