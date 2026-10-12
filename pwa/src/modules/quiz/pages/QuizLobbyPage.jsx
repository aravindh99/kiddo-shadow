import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Button, Paper, Avatar, Stack, CircularProgress, Chip } from "@mui/material";
import { useQuizSession } from "../hooks/useQuizSession";

function getPlayerName(player, fallback = "Player") {
    const name = String(player?.displayName || player?.name || "").trim();
    const studentNumber = String(player?.admission_no || player?.username || "").trim();
    return name && name.toLowerCase() !== "student" ? name : studentNumber || fallback;
}

export default function QuizLobbyPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { status, player, lobby, isHost, startQuiz } = useQuizSession({
        sessionId: id,
        roomCode: location.state?.roomCode,
        host: location.state?.host,
    });
    const displayRoomCode = location.state?.roomCode || player?.roomCode || id;

    useEffect(() => {
        if (status === "IN_PROGRESS") {
            const isTeacher = location.pathname.startsWith("/teacher");
            const isStudentDemo = location.pathname.startsWith("/students");
            const base = isTeacher ? "/teacher" : isStudentDemo ? "/students" : "/student";
            navigate(`${base}/quiz/${id}/play`, { replace: true });
        }
    }, [status, id, navigate, location.pathname]);

    return (
        <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Lobby
                </Typography>
                <Typography variant="h2" color="primary" sx={{ my: 3, letterSpacing: 4, fontWeight: 'bold' }}>
                    {displayRoomCode}
                </Typography>
                <Typography color="text.secondary">
                    Share this code with your friends!
                </Typography>

                <Box sx={{ my: 4 }}>
                    <Typography variant="h6" gutterBottom>Players Joined</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Host: {lobby?.hostName || "Host"}
                    </Typography>
                    <Stack
                        direction="row"
                        justifyContent="center"
                        spacing={2}
                        sx={{ flexWrap: "wrap", rowGap: 1.5 }}
                    >
                        {(lobby?.players || []).map((joinedPlayer) => {
                            const playerName = getPlayerName(joinedPlayer);

                            return (
                            <Stack key={joinedPlayer.playerId || joinedPlayer.userId} spacing={0.75} alignItems="center">
                                <Avatar src={joinedPlayer.avatarUrl || undefined}>
                                    {playerName[0] || "?"}
                                </Avatar>
                                <Typography variant="caption" fontWeight="bold">
                                    {playerName}
                                </Typography>
                                {joinedPlayer.isHost ? (
                                    <Chip label="Host" size="small" color="primary" />
                                ) : null}
                            </Stack>
                            );
                        })}
                    </Stack>
                </Box>

                {isHost ? (
                    <Button variant="contained" size="large" fullWidth onClick={startQuiz}>
                        Start Game
                    </Button>
                ) : (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <CircularProgress size={20} />
                        <Typography>Waiting for host to start...</Typography>
                    </Stack>
                )}
            </Paper>
        </Box>
    );
}
