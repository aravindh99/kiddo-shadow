import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Box, Typography, Button, Alert, Stack } from "@mui/material";
import { RefreshRounded, LoginRounded } from "@mui/icons-material";
import { useAuth } from "./AuthProvider";

function AuthErrorFallback({ error, resetErrorBoundary }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    resetErrorBoundary();
  };

  const isAuthError = error?.message?.includes("token") || 
                     error?.message?.includes("auth") ||
                     error?.message?.includes("login") ||
                     error?.response?.status === 401;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 400, textAlign: "center" }}>
        <Typography variant="h5" color="error" gutterBottom>
          {isAuthError ? "Authentication Error" : "Something went wrong"}
        </Typography>
        
        <Alert severity="error" sx={{ textAlign: "left" }}>
          {error?.message || "An unexpected error occurred"}
        </Alert>

        <Typography variant="body2" color="text.secondary">
          {isAuthError 
            ? "There was a problem with your authentication. Please log in again."
            : "Please try refreshing the page or contact support if the problem persists."
          }
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={resetErrorBoundary}
          >
            Try Again
          </Button>
          
          {isAuthError && (
            <Button
              variant="contained"
              startIcon={<LoginRounded />}
              onClick={handleLogout}
            >
              Log In Again
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function AuthErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={AuthErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for debugging
        console.error("Auth Error Boundary caught an error:", error, errorInfo);
        
        // You could send this to an error reporting service
        // errorReportingService.captureException(error, { extra: errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}