import { Container, Grid, Card, CardContent, Typography, Box, Avatar, Stack, CircularProgress, Divider, Button, Alert } from "@mui/material";
import { Person, People } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthProvider";
import { useEffect, useState } from "react";
import CreateJoinGameDialog from "../components/CreateJoinGameDialog";
import { getQuizHistory } from "../api/quiz.api";

export default function QuizLandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [multiplayerOpen, setMultiplayerOpen] = useState(false);
    const isTeacher = user?.role === "teacher";
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setHistoryLoading(true);
        getQuizHistory({ limit: 10 })
            .then((res) => {
                if (!mounted) return;
                setHistory(res.data?.items || []);
            })
            .catch(() => {
                if (!mounted) return;
                setHistory([]);
            })
            .finally(() => {
                if (!mounted) return;
                setHistoryLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <Container maxWidth="sm" sx={{ mt: 4, pb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                Quiz Zone
            </Typography>

            <Grid container spacing={3}>
                {!isTeacher && (
                    <Grid item xs={12}>
                        <Card
                            sx={{
                                borderRadius: 4,
                                cursor: 'pointer',
                                bgcolor: '#e3f2fd',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' }
                            }}
                            onClick={() => navigate('single')}
                        >
                            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, mr: 3 }}>
                                    <Person fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Single Player</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Challenge yourself AI.
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Multiplayer */}
                <Grid item xs={12}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            cursor: 'pointer',
                            bgcolor: '#f3e5f5',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}
                        onClick={() => setMultiplayerOpen(true)}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 60, height: 60, mr: 3 }}>
                                <People fontSize="large" />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Multiplayer</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Compete with friends.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <CreateJoinGameDialog
                open={multiplayerOpen}
                onClose={() => setMultiplayerOpen(false)}
            />

            <Box sx={{ mt: 5 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Recent Quizzes
                </Typography>

                {historyLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {!historyLoading && history.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No quiz history yet. Start a quiz to see it here.
                    </Typography>
                )}

                {!historyLoading && history.length > 0 && (
                    <Stack spacing={2}>
                        {history.map((item) => {
                            const rawTitle =
                                item.quiz?.title ||
                                item.quiz?.topic ||
                                "Quiz";
                            const cleanedTitle = rawTitle.replace(/\s*quiz$/i, "").trim();
                            const title = cleanedTitle || rawTitle;
                            return (
                            <Card key={item.session_id} sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography fontWeight="bold">
                                                {title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.mode === "MULTI" ? "Multiplayer" : "Single Player"}
                                                {item.started_at ? ` • ${new Date(item.started_at).toLocaleString()}` : ""}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: "right" }}>
                                            <Typography fontWeight="bold">
                                                {item.my_score ?? 0} pts
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {item.players?.length > 0 && (
                                        <>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="caption" color="text.secondary">
                                                    Players:
                                                </Typography>
                                                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                                    {item.players.slice(0, 6).map((p) => (
                                                        <Avatar
                                                            key={`${item.session_id}-${p.user_id}`}
                                                            src={p.avatar_url || undefined}
                                                            sx={{ width: 28, height: 28, fontSize: 12 }}
                                                        >
                                                            {p.name?.[0] || "P"}
                                                        </Avatar>
                                                    ))}
                                                </Stack>
                                            </Stack>
                                        </>
                                    )}

                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            size="small"
                                            onClick={() => navigate(`/${isTeacher ? "teacher" : "student"}/quiz/${item.session_id}/results`)}
                                        >
                                            View Results
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                        })}
                    </Stack>
                )}
            </Box>
        </Container>
    );
}
