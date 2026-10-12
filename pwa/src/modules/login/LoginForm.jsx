import {
  Box,
  Button,
  TextField,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Person,
  LockRounded,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema } from "./login.schema";
import { useLogin } from "./useLogin";

export default function LoginForm({ onSuccess }) {
  const { handleLogin, loading, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data) {
    const ok = await handleLogin(data);
    if (ok && onSuccess) onSuccess();
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2}>
        <TextField
          label="Username"
          {...register("username")}
          error={!!errors.username}
          helperText={errors.username?.message}
          autoComplete="username"
          fullWidth
          variant="filled"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <Person fontSize="small" />
              </InputAdornment>
            ),
          }}
          inputProps={{ maxLength: 40 }}
          sx={(theme) => ({
            "& .MuiFilledInput-root": {
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(15, 23, 42, 0.9)"
                  : "rgba(255, 255, 255, 0.95)",
              border:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(148, 163, 184, 0.25)"
                  : "1px solid rgba(99, 102, 241, 0.12)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 12px 26px rgba(2, 6, 23, 0.5)"
                  : "0 10px 24px rgba(15, 23, 42, 0.08)",
            },
            "& .MuiInputBase-input": {
              color: theme.palette.text.primary,
            },
            "& .MuiInputLabel-root": {
              color: theme.palette.text.secondary,
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: theme.palette.primary.main,
            },
          })}
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
          autoComplete="current-password"
          fullWidth
          variant="filled"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <LockRounded fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((p) => !p)}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          inputProps={{ maxLength: 32 }}
          sx={(theme) => ({
            "& .MuiFilledInput-root": {
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(15, 23, 42, 0.9)"
                  : "rgba(255, 255, 255, 0.95)",
              border:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(148, 163, 184, 0.25)"
                  : "1px solid rgba(99, 102, 241, 0.12)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 12px 26px rgba(2, 6, 23, 0.5)"
                  : "0 10px 24px rgba(15, 23, 42, 0.08)",
            },
            "& .MuiInputBase-input": {
              color: theme.palette.text.primary,
            },
            "& .MuiInputLabel-root": {
              color: theme.palette.text.secondary,
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: theme.palette.primary.main,
            },
          })}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          disableElevation
          sx={{
            borderRadius: 2,
            py: 1.3,
            textTransform: "none",
            fontWeight: 700,
            background:
              "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
            boxShadow: "0 16px 30px rgba(79, 70, 229, 0.28)",
            "&:hover": {
              background:
                "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            },
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </Stack>
    </Box>
  );
}
