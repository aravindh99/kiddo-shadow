import { Box, Typography } from "@mui/material";

export default function OfflinePage() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
      }}
    >
      <Typography color="text.secondary">
        You are offline. Please check your internet connection.
      </Typography>
    </Box>
  );
}
