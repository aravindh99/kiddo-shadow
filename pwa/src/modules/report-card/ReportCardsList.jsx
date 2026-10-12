import { useEffect, useState } from "react";
import { Container, Paper, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, CircularProgress, Alert, Stack, Chip, Box, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Visibility, ExpandMore, Schedule } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { listMyReportCards } from "./reportCard.api";
import api from "../../api/axios";

export default function ReportCardsList() {
    const [reportCards, setReportCards] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const studentBasePath = location.pathname.startsWith("/students")
        ? "/students"
        : "/student";

    useEffect(() => {
        fetchReportCards();
    }, []);

    async function fetchReportCards() {
        try {
            setLoading(true);
            const [reportRes, examRes] = await Promise.all([
                listMyReportCards(),
                api.get("/exams"),
            ]);
            setReportCards(reportRes.data.data || []);
            setExams(examRes.data.items || []);
        } catch (err) {
            setError("Failed to load report cards.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1e293b' }}>
                My Exams & Report Cards
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            <Stack spacing={4}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#334155' }}>
                        Exams Schedule
                    </Typography>
                    {exams.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <Typography color="text.secondary">No exams scheduled yet.</Typography>
                        </Paper>
                    ) : (
                        <Box>
                            {exams.map((exam) => (
                                <ExamScheduleItem key={exam.id} exam={exam} />
                            ))}
                        </Box>
                    )}
                </Box>

                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#334155' }}>
                        Report Cards
                    </Typography>
                    {reportCards.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <Typography color="text.secondary">No report cards found.</Typography>
                        </Paper>
                ) : (
                    <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                        <List disablePadding>
                            {reportCards.map((rc, index) => (
                                <ListItem
                                    key={rc.id}
                                    divider={index < reportCards.length - 1}
                                    button
                                    onClick={() => navigate(`${studentBasePath}/report-cards/${rc.id}`)}
                                    sx={{ py: 2, px: 3 }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {rc.Exam?.name || "Exam Report"}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Published Date: {new Date(rc.Exam?.date || rc.createdAt).toLocaleDateString()}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction sx={{ right: 24 }}>
                                        <Button 
                                            variant="outlined" 
                                            size="small"
                                            startIcon={<Visibility />}
                                            onClick={() => navigate(`${studentBasePath}/report-cards/${rc.id}`)}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            View Report
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
                </Box>
            </Stack>
        </Container>
    );
}

function ExamScheduleItem({ exam }) {
    const [timetable, setTimetable] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleExpand = async (e, isExpanded) => {
        setExpanded(isExpanded);
        if (isExpanded && !timetable) {
            setLoading(true);
            try {
                const res = await api.get(`/exams/${exam.id}/timetable`);
                setTimetable(res.data?.data || []);
            } catch (err) {
                console.error("Failed to load timetable", err);
                setTimetable([]);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Accordion 
            expanded={expanded} 
            onChange={handleExpand} 
            disableGutters
            sx={{ 
                mb: 2, 
                borderRadius: '12px !important', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                '&:before': { display: 'none' },
                overflow: 'hidden'
            }}
        >
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1.5, bgcolor: expanded ? '#f8fafc' : '#fff' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">{exam.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Schedule fontSize="small" sx={{ mr: 0.5, color: '#64748b' }} />
                        {new Date(exam.start_date).toLocaleDateString()} to {new Date(exam.end_date).toLocaleDateString()}
                    </Typography>
                </Box>
                {exam.is_locked && (
                    <Chip size="small" label="Locked" color="warning" sx={{ ml: 2, alignSelf: 'center', fontWeight: 'bold' }} />
                )}
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 1, md: 3 }, pb: 3, pt: 2, bgcolor: '#fff' }}>
                {loading ? (
                    <Box textAlign="center" py={4}><CircularProgress size={32} thickness={4} /></Box>
                ) : timetable && timetable.length > 0 ? (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Subject</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Marks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {timetable.map(t => (
                                    <TableRow key={t.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ py: 1.5, whiteSpace: 'nowrap' }}>
                                            {t.exam_date ? new Date(t.exam_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5, fontWeight: 500 }}>{t.subject?.name || t.Subject?.name || 'N/A'}</TableCell>
                                        <TableCell sx={{ py: 1.5, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                            {t.start_time ? `${t.start_time} - ${t.end_time}` : '--:--'}
                                        </TableCell>
                                        <TableCell sx={{ py: 1.5 }}>{t.max_marks || '100'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box textAlign="center" py={4} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1">
                        <Typography color="text.secondary" variant="body1">
                            The timetable for this exam has not been published yet.
                        </Typography>
                    </Box>
                )}
            </AccordionDetails>
        </Accordion>
    );
}
