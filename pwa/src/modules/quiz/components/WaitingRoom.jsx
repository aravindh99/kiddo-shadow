import { Box, Button, Typography, List, ListItem } from "@mui/material";
import { useQuizSession } from "../hooks/useQuizSession";
import { useAuth } from "../../../auth/AuthProvider";

export default function WaitingRoom({ sessionId }) {
  const { user } = useAuth();
  const {
    players,
    startQuiz,
    isHost,
    status,
  } = useQuizSession(sessionId);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6">Waiting Room</Typography>

      <Typography variant="caption" color="text.secondary">
        Players joined: {players.length}
      </Typography>

      <List sx={{ mt: 2 }}>
        {players.map((p) => (
          <ListItem key={p.id}>
            {p.name} {p.status === "READY" && "✅"}
          </ListItem>
        ))}
      </List>

      {isHost && (status === "WAITING" || status === "LOBBY") && (
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={startQuiz}
        >
          Start Quiz
        </Button>
      )}

      {!isHost && (
        <Typography sx={{ mt: 3 }} align="center">
          Waiting for teacher to start…
        </Typography>
      )}
    </Box>
  );
}
