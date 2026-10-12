import { Box, Container, Stack, Typography, Button } from "@mui/material";
import { HourglassTopRounded } from "@mui/icons-material";
import { useAuth } from "../auth/AuthProvider";
import { useEffect, useState } from "react";
import { getMyProfile } from "../modules/profile/profile.api";
import { useNavigate } from "react-router-dom";

export default function ApprovalPending() {
  const { user, logout, updateUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const checkStatus = async () => {
    if (!user?.role) return;
    try {
      setChecking(true);
      const res = await getMyProfile(user.role);
      const data = res?.data || {};
      const status = data?.approval_status || data?.user?.approval_status;
      const firstLogin = data?.first_login === true || data?.user?.first_login === true;
      const normalized = data?.user ? { ...data, ...data.user } : data;

      updateUser?.({
        ...(status ? { approval_status: status } : {}),
        first_login: firstLogin,
        name: normalized?.name,
        avatar_url: normalized?.avatar_url || normalized?.avatar || "",
      });

      if (status === "approved") {
        navigate(`/${user.role}/dashboard`, { replace: true });
      }
    } catch (err) {
      console.error("Failed to re-check approval status:", err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user?.role]);

  const displayName = (user?.name || user?.username || "").trim() || "Student";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, sm: 8 },
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "warning.light",
              color: "warning.dark",
            }}
          >
            <HourglassTopRounded />
          </Box>

          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              {displayName}, Approval Pending
            </Typography>
            <Typography color="text.secondary">
              {user?.role
                ? `Your ${user.role.replace("_", " ")} account is waiting for approval.`
                : "Your account is waiting for approval."}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please contact your school admin. You can still complete your profile if needed.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={checkStatus} disabled={checking}>
              {checking ? "Checking..." : "Check Again"}
            </Button>
            {user?.role && (
              <Button
                variant="contained"
                onClick={() => navigate(`/${user.role}/profile`)}
              >
                Complete Profile
              </Button>
            )}
            <Button variant="contained" color="warning" onClick={logout}>
              Logout
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
