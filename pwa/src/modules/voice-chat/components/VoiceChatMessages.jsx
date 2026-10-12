import { Box, Paper, Typography } from "@mui/material";

export default function VoiceChatMessages({ messages }) {
  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
      {messages.map((m, i) => (
        <Paper
          key={i}
          sx={{
            p: 1,
            mb: 1,
            maxWidth: "80%",
            ml: m.role === "user" ? "auto" : 0,
            bgcolor: m.role === "user" ? "primary.main" : "grey.200",
            color: m.role === "user" ? "primary.contrastText" : "text.primary",
          }}
        >
          <Typography variant="body2">{m.text}</Typography>
        </Paper>
      ))}
    </Box>
  );
}
