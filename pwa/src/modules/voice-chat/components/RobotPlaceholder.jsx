import { Box, Typography } from "@mui/material";

export default function RobotPlaceholder({ speaking }) {
  return (
    <Box
      sx={{
        height: 220,
        bgcolor: "grey.100",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">
        🤖 Teacher AI {speaking ? "speaking..." : "idle"}
      </Typography>
    </Box>
  );
}
