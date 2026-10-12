import {
    Dialog,
    DialogTitle,
    DialogContent,
    Tabs,
    Tab,
    Box,
    TextField,
    Button,
    Stack
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinQuizRoom, createMultiplayerQuiz } from "../api/quiz.api";

export default function CreateJoinGameDialog({ open, onClose }) {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [roomCode, setRoomCode] = useState("");
    const [topic, setTopic] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        if (!topic.trim()) return;
        setLoading(true);
        try {
            const res = await createMultiplayerQuiz({
                topic,
                difficulty: "MEDIUM",
                numQuestions: 5,
                maxPlayers: 4,
            });
            const sessionId = res.data?.sessionId;
            const code = res.data?.roomCode;
            navigate(`${sessionId}/lobby`, {
                state: { roomCode: code, host: true },
            });
        } catch {
            alert("Failed to create session");
        } finally {
            setLoading(false);
        }
    }

    async function handleJoin() {
        if (!roomCode) return;
        setLoading(true);
        try {
            const trimmed = roomCode.trim();
            const res = await joinQuizRoom({
                roomCode: trimmed,
                sessionId: /^\d+$/.test(trimmed) ? Number(trimmed) : undefined,
            });
            const sessionId = res.data?.sessionId || trimmed;
            navigate(`${sessionId}/lobby`, {
                state: {
                    roomCode: res.data?.roomCode || trimmed,
                    host: Boolean(res.data?.isHost),
                },
            });
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to join session. Check code.";
            alert(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Multiplayer Quiz</DialogTitle>
            <DialogContent>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
                    <Tab label="Create Game" />
                    <Tab label="Join Game" />
                </Tabs>

                {tab === 0 ? (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                            label="Quiz Topic"
                            helperText="Example: Solar System"
                            fullWidth
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleCreate} disabled={loading || !topic.trim()}>
                            {loading ? "Creating..." : "Create Room"}
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                            label="Game Code or Session ID"
                            fullWidth
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />
                        <Button variant="contained" onClick={handleJoin} disabled={!roomCode || loading}>
                            {loading ? "Joining..." : "Join Room"}
                        </Button>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
}
