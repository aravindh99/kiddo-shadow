import React, { useState, useEffect } from "react";
import { 
    Box, Typography, Button, IconButton, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Grid, MenuItem, CircularProgress, Alert, useMediaQuery, useTheme, Card, CardContent, Autocomplete
} from "@mui/material";
import { Add, Delete, Save } from "@mui/icons-material";
import api from "../../../api/axios";
import DatePickerField from "../../../components/DatePickerField";

export default function ExamTimetablePanel({ exam }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [entries, setEntries] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const [subsRes, ttRes] = await Promise.all([
                    api.get("/subjects", { params: { class_id: exam?.class_id } }),
                    api.get(`/exams/${exam.id}/timetable`)
                ]);
                if (!active) return;
                
                const subjectsData = subsRes.data?.items || subsRes.data?.data || subsRes.data || [];
                setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
                
                const ttData = ttRes.data?.data || [];
                if (Array.isArray(ttData) && ttData.length > 0) {
                    setEntries(ttData.map(t => ({
                        id: t.id,
                        subject_id: t.subject_id,
                        exam_date: t.exam_date,
                        start_time: t.start_time || "",
                        end_time: t.end_time || "",
                        max_marks: t.max_marks || ""
                    })));
                } else {
                    setEntries([{ subject_id: "", exam_date: exam.start_date || "", start_time: "", end_time: "", max_marks: "100" }]);
                }
            } catch (err) {
                console.error("Failed to load timetable data", err);
                if (active) setError("Failed to load data.");
            } finally {
                if (active) setLoading(false);
            }
        };
        if (exam) load();
        return () => { active = false; };
    }, [exam]);

    const handleAddEntry = () => {
        setEntries([...entries, { subject_id: "", exam_date: exam.start_date || "", start_time: "", end_time: "", max_marks: "100" }]);
    };

    const handleRemoveEntry = (index) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);
            
            const payload = {
                entries: entries
                    .filter(e => e.subject_id && e.exam_date)
                    .map(e => ({
                        subject_id: Number(e.subject_id),
                        exam_date: e.exam_date,
                        start_time: e.start_time || undefined,
                        end_time: e.end_time || undefined,
                        max_marks: e.max_marks ? Number(e.max_marks) : undefined
                    }))
            };

            if (payload.entries.length === 0) {
                setError("Please complete at least one entry with Subject and Date.");
                return;
            }

            await api.post(`/exams/${exam.id}/timetable`, payload);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to save timetable.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Box p={2} textAlign="center"><CircularProgress size={24} /></Box>;

    return (
        <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, mt: 1, border: "1px solid #e2e8f0" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Timetable: {exam.name}
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save Timetable"}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Timetable saved successfully!</Alert>}

            {isMobile ? (
                <Box>
                    {entries.map((entry, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: "#fff", position: "relative" }}>
                            <CardContent sx={{ p: 2, pb: "16px !important" }}>
                                <IconButton 
                                    size="small" 
                                    color="error" 
                                    onClick={() => handleRemoveEntry(index)}
                                    sx={{ position: "absolute", top: 8, right: 8 }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                                <Grid container spacing={2} mt={1}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="textSecondary" mb={0.5} display="block">Date</Typography>
                                        <DatePickerField
                                            value={entry.exam_date}
                                            onChange={(val) => handleChange(index, "exam_date", val)}
                                            size="small"
                                            minDate={exam.start_date}
                                            maxDate={exam.end_date}
                                            hideLabel
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="textSecondary" mb={0.5} display="block">Subject</Typography>
                                        <Autocomplete
                                            options={subjects}
                                            getOptionLabel={(option) => option.name || ""}
                                            value={subjects.find(s => s.id === entry.subject_id) || null}
                                            onChange={(e, newValue) => handleChange(index, "subject_id", newValue ? newValue.id : "")}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            size="small"
                                            fullWidth
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    placeholder="Select Subject" 
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="textSecondary" mb={0.5} display="block">Start Time</Typography>
                                        <TextField
                                            type="time"
                                            size="small"
                                            fullWidth
                                            value={entry.start_time}
                                            onChange={(e) => handleChange(index, "start_time", e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="textSecondary" mb={0.5} display="block">End Time</Typography>
                                        <TextField
                                            type="time"
                                            size="small"
                                            fullWidth
                                            value={entry.end_time}
                                            onChange={(e) => handleChange(index, "end_time", e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="textSecondary" mb={0.5} display="block">Max Marks</Typography>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Max"
                                            value={entry.max_marks}
                                            onChange={(e) => handleChange(index, "max_marks", e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0" }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell>Start Time</TableCell>
                                <TableCell>End Time</TableCell>
                                <TableCell>Max Marks</TableCell>
                                <TableCell width={50}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <DatePickerField
                                            value={entry.exam_date}
                                            onChange={(val) => handleChange(index, "exam_date", val)}
                                            size="small"
                                            minDate={exam.start_date}
                                            maxDate={exam.end_date}
                                            hideLabel
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Autocomplete
                                            options={subjects}
                                            getOptionLabel={(option) => option.name || ""}
                                            value={subjects.find(s => s.id === entry.subject_id) || null}
                                            onChange={(e, newValue) => handleChange(index, "subject_id", newValue ? newValue.id : "")}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            size="small"
                                            fullWidth
                                            sx={{ minWidth: 150 }}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    placeholder="Select Subject" 
                                                />
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={entry.start_time}
                                            onChange={(e) => handleChange(index, "start_time", e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={entry.end_time}
                                            onChange={(e) => handleChange(index, "end_time", e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            placeholder="Max"
                                            value={entry.max_marks}
                                            onChange={(e) => handleChange(index, "max_marks", e.target.value)}
                                            sx={{ width: 100 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="error" onClick={() => handleRemoveEntry(index)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            
            <Button 
                startIcon={<Add />} 
                onClick={handleAddEntry}
                sx={{ mt: 2 }}
                size="small"
            >
                Add Subject
            </Button>
        </Box>
    );
}
