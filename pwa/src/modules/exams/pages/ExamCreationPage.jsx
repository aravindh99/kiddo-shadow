import { Typography, Paper, TextField, Button, Box, Grid, MenuItem, Alert, CircularProgress, Snackbar, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Collapse, TablePagination, InputAdornment, useTheme, useMediaQuery, Card, CardContent, CardActions } from "@mui/material";
import { Add, KeyboardArrowDown, KeyboardArrowUp, Search } from "@mui/icons-material";
import { useState, useEffect, useMemo, Fragment } from "react";
import api from "../../../api/axios";
import DatePickerField from "../../../components/DatePickerField";
import { createNotification } from "../../notifications/notifications.api";
import ExamTimetablePanel from "../components/ExamTimetablePanel";

const createExam = (data) => api.post("/exams", data);
const fetchAssignments = () => api.get("/teacher-assignments/teacher/me");
const fetchExams = () => api.get("/exams");

export default function ExamCreationPage() {
    const [loading, setLoading] = useState(false);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        start_date: "",
        end_date: "",
        class_id: "",
    });

    const [exams, setExams] = useState([]);
    const [expandedExamId, setExpandedExamId] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    
    const loadData = async (active = true) => {
        try {
            setAssignmentsLoading(true);
            const [assignmentsRes, examsRes] = await Promise.all([
                fetchAssignments().catch(() => ({ data: [] })),
                fetchExams().catch(() => ({ data: { items: [] } }))
            ]);
            const data = assignmentsRes?.data?.data ?? assignmentsRes?.data ?? [];
            const examsData = examsRes?.data?.items ?? [];
            if (!active) return;
            setAssignments(Array.isArray(data) ? data : []);
            setExams(Array.isArray(examsData) ? examsData : []);
        } catch (err) {
            console.error("Failed to load data", err);
            if (!active) return;
            setAssignments([]);
            setExams([]);
        } finally {
            if (active) setAssignmentsLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        loadData(active);
        return () => {
            active = false;
        };
    }, []);

    const classOptions = useMemo(() => {
        const map = new Map();
        assignments.forEach((a) => {
            const classId = a.class_id;
            const className = a.Class?.class_name || a.class?.class_name || a.class_id;
            if (!map.has(classId)) {
                map.set(classId, { class_id: classId, class_name: className });
            }
        });
        return Array.from(map.values());
    }, [assignments]);

    const visibleExams = useMemo(() => {
        const teacherClassIds = new Set(classOptions.map(c => c.class_id));
        let filtered = exams.filter(exam => teacherClassIds.has(exam.class_id));

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(exam => {
                const classMatch = classOptions.find(c => c.class_id === exam.class_id);
                const className = classMatch ? classMatch.class_name : String(exam.class_id);
                return exam.name.toLowerCase().includes(query) || className.toLowerCase().includes(query);
            });
        }
        return filtered;
    }, [exams, classOptions, searchQuery]);

    const paginatedExams = useMemo(() => {
        return visibleExams.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [visibleExams, page, rowsPerPage]);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === "name") {
            // Capitalize first letter of each word (e.g. 'mid term' -> 'Mid Term')
            value = value.replace(/\b\w/g, (char) => char.toUpperCase());
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            await createExam({
                name: formData.name,
                class_id: Number(formData.class_id),
                start_date: formData.start_date,
                end_date: formData.end_date,
            });

            // Send notification to students
            try {
                await createNotification({
                    title: `New Exam: ${formData.name}`,
                    message: `An exam has been scheduled from ${new Date(formData.start_date).toLocaleDateString()} to ${new Date(formData.end_date).toLocaleDateString()}.`,
                    target_role: "student",
                    class_id: Number(formData.class_id),
                });
            } catch (notifErr) {
                console.warn("Failed to send notification, but exam was created", notifErr);
            }
            setSuccess(true);
            setFormData({
                name: "",
                start_date: "",
                end_date: "",
                class_id: "",
            });
            loadData(); // Refresh exams list
        } catch (err) {
            console.error("Failed to create exam", err);
            setError("Failed to create exam");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
            <Box sx={{ width: "100%" }}>
                <Typography variant="h5" sx={{ mb: { xs: 2, md: 4 }, fontWeight: 'bold', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    Create New Exam
                </Typography>

                <Paper
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, width: "100%", boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                >
                    <Grid container spacing={2} alignItems="stretch">
                        {error && (
                            <Grid item xs={12}>
                                <Alert severity="error" variant="outlined">{error}</Alert>
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Exam Name"
                                name="name"
                                placeholder="e.g., Mid-Term Mathematics"
                                value={formData.name}
                                onChange={handleChange}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <DatePickerField
                                label="Start Date"
                                value={formData.start_date}
                                onChange={(val) =>
                                    setFormData((prev) => ({ ...prev, start_date: val }))
                                }
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <DatePickerField
                                label="End Date"
                                value={formData.end_date}
                                onChange={(val) =>
                                    setFormData((prev) => ({ ...prev, end_date: val }))
                                }
                                minDate={formData.start_date || undefined}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                required
                                label="Class"
                                name="class_id"
                                value={formData.class_id}
                                onChange={handleChange}
                                disabled={assignmentsLoading}
                                fullWidth
                                size="small"
                                slotProps={{
                                    select: {
                                        displayEmpty: true,
                                        renderValue: (selected) => {
                                            if (!selected) return "Select your class";
                                            const match = classOptions.find(
                                                (c) => String(c.class_id) === String(selected)
                                            );
                                            return match ? `Class ${match.class_name}` : `Class ${selected}`;
                                        },
                                    },
                                }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: "100%", "& .MuiInputBase-root": { width: "100%" } }}
                            >
                                {assignmentsLoading && (
                                    <MenuItem value="">
                                        <CircularProgress size={18} sx={{ mr: 1 }} />
                                        Loading classes...
                                    </MenuItem>
                                )}
                                {!assignmentsLoading && classOptions.length === 0 && (
                                    <MenuItem value="">
                                        No assigned classes
                                    </MenuItem>
                                )}
                                {classOptions.map((c) => (
                                    <MenuItem key={c.class_id} value={c.class_id}>
                                        Class {c.class_name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading || !formData.class_id}
                                startIcon={<Add />}
                                sx={{
                                    mt: { xs: 2, sm: 0 },
                                    height: 44,
                                    borderRadius: 2,
                                    px: 3,
                                    width: { xs: "100%", sm: "auto" },
                                }}
                            >
                                {loading ? "Creating..." : "Schedule Exam"}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
                <Snackbar
                    open={success}
                    autoHideDuration={2500}
                    onClose={() => setSuccess(false)}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                    <Alert severity="success" onClose={() => setSuccess(false)} variant="filled" sx={{ width: '100%', boxShadow: 3 }}>
                        Exam created!
                    </Alert>
                </Snackbar>

                <Box 
                    display="flex" 
                    flexDirection={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'flex-end' }} 
                    gap={2}
                    sx={{ mt: 6, mb: 2 }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Scheduled Exams
                    </Typography>
                    <TextField
                        size="small"
                        placeholder="Search by exam name or class..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: { xs: '100%', sm: 300 } }}
                    />
                </Box>
                <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    {isMobile ? (
                        <Box sx={{ p: 2, bgcolor: "#f8fafc" }}>
                            {visibleExams.length === 0 ? (
                                <Alert severity="info">No exams found.</Alert>
                            ) : (
                                paginatedExams.map((exam) => {
                                    const classMatch = classOptions.find(c => c.class_id === exam.class_id);
                                    const className = classMatch ? classMatch.class_name : exam.class_id;
                                    const isPast = new Date(exam.end_date) < new Date();
                                    const isExpanded = expandedExamId === exam.id;
                                    return (
                                        <Card key={exam.id} sx={{ mb: 2, borderRadius: 2, border: "1px solid #e2e8f0", boxShadow: "none" }}>
                                            <CardContent sx={{ pb: 1 }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {exam.name}
                                                    </Typography>
                                                    {exam.is_locked ? (
                                                        <Chip label="Locked" color="error" size="small" />
                                                    ) : isPast ? (
                                                        <Chip label="Completed" color="default" size="small" />
                                                    ) : (
                                                        <Chip label="Upcoming" color="primary" size="small" />
                                                    )}
                                                </Box>
                                                <Typography variant="body2" color="textSecondary" mb={0.5}>
                                                    <strong>Class:</strong> {className}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary" mb={0.5}>
                                                    <strong>Start:</strong> {exam.start_date}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    <strong>End:</strong> {exam.end_date}
                                                </Typography>
                                            </CardContent>
                                            <CardActions disableSpacing sx={{ borderTop: "1px solid #e2e8f0", pt: 1, pb: 1, px: 2 }}>
                                                <Button 
                                                    size="small" 
                                                    onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                                                    endIcon={isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                    fullWidth
                                                >
                                                    {isExpanded ? "Hide Timetable" : "View Timetable"}
                                                </Button>
                                            </CardActions>
                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 1, bgcolor: "#fff", borderTop: "1px solid #e2e8f0" }}>
                                                    <ExamTimetablePanel exam={exam} />
                                                </Box>
                                            </Collapse>
                                        </Card>
                                    );
                                })
                            )}
                        </Box>
                    ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 600 }}>
                            <TableHead sx={{ bgcolor: "background.default" }}>
                                <TableRow>
                                    <TableCell width={50}></TableCell>
                                    <TableCell>Exam Name</TableCell>
                                    <TableCell>Class</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {visibleExams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Alert severity="info" sx={{ display: "inline-flex" }}>No exams found.</Alert>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedExams.map((exam) => {
                                        const classMatch = classOptions.find(c => c.class_id === exam.class_id);
                                        const className = classMatch ? classMatch.class_name : exam.class_id;
                                        const isPast = new Date(exam.end_date) < new Date();
                                        const isExpanded = expandedExamId === exam.id;
                                        return (
                                            <Fragment key={exam.id}>
                                                <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                    <TableCell>
                                                        <IconButton
                                                            aria-label="expand row"
                                                            size="small"
                                                            onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                                                        >
                                                            {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 500 }}>{exam.name}</TableCell>
                                                    <TableCell>Class {className}</TableCell>
                                                    <TableCell>{exam.start_date}</TableCell>
                                                    <TableCell>{exam.end_date}</TableCell>
                                                    <TableCell align="center">
                                                        {exam.is_locked ? (
                                                            <Chip label="Locked" color="error" size="small" />
                                                        ) : isPast ? (
                                                            <Chip label="Completed" color="default" size="small" />
                                                        ) : (
                                                            <Chip label="Upcoming" color="primary" size="small" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                            <Box sx={{ margin: 1, mb: 3 }}>
                                                                <ExamTimetablePanel exam={exam} />
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </Fragment>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    )}
                    <TablePagination
                        component="div"
                        count={visibleExams.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[]}
                        labelRowsPerPage=""
                    />
                </Paper>
            </Box>
        </Container>
    );
}
