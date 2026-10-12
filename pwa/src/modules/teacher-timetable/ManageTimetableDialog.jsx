import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Alert,
    IconButton,
    Typography,
    Box,
    Divider,
} from "@mui/material";
import { Add, Delete, ArrowBack, SwapVert, CheckCircle, Cancel } from "@mui/icons-material";
import { getSectionAssignments, saveTimetable, getSectionTimetable, getSubstituteTeachers } from "./teacherTimetable.api";

export default function ManageTimetableDialog({ open, onClose, onSuccess, classTeacherSections = [], teacherAssignments = [], teacherTimetable = {}, defaultDay = "monday" }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [classSection, setClassSection] = useState("");
    const [dayOfWeek, setDayOfWeek] = useState(defaultDay);
    const [sectionAssignments, setSectionAssignments] = useState([]);

    // Entries state
    const [entries, setEntries] = useState([
        { start_time: "09:00", end_time: "10:00", teacher_assignment_id: "", title: "", is_break: false }
    ]);
    const [hiddenEntries, setHiddenEntries] = useState([]);

    // Substitute Teacher Modal State
    const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
    const [substituteTeachers, setSubstituteTeachers] = useState([]);
    const [loadingSubstitute, setLoadingSubstitute] = useState(false);
    const [activePeriodIndex, setActivePeriodIndex] = useState(null);

    const classOptions = useMemo(() => {
        return classTeacherSections.map((s) => ({
            value: `${s.class_id},${s.section_id}`,
            label: `${s.Class?.class_name || s.class?.class_name || "Class"} - ${s.Section?.name || s.section?.name || "Section"}`,
        }));
    }, [classTeacherSections]);

    useEffect(() => {
        if (open && classOptions.length > 0 && !classSection) {
            setClassSection(classOptions[0].value);
            setDayOfWeek(defaultDay);
        } else if (!open) {
            setClassSection("");
            setSectionAssignments([]);
            setEntries([{ start_time: "09:00", end_time: "10:00", teacher_assignment_id: "", title: "", is_break: false }]);
            setHiddenEntries([]);
        }
    }, [open, classOptions, classSection, defaultDay]);

    useEffect(() => {
        async function loadAssignmentsAndTimetable() {
            if (!classSection) {
                setSectionAssignments([]);
                return;
            }

            const [classId, sectionId] = classSection.split(",");
            try {
                const res = await getSectionAssignments(sectionId);
                const data = res?.data?.data ?? res?.data ?? [];
                const dataArray = Array.isArray(data) ? data : [];

                // Load existing timetable for this section
                if (open) {
                    const ttRes = await getSectionTimetable(classId, sectionId);
                    const ttData = ttRes?.data?.data ?? ttRes?.data ?? {};
                    const dayEntries = ttData[dayOfWeek] || [];

                    const myAssignmentIds = teacherAssignments.map(a => String(a.id));

                    // Filter dropdown to only show the logged-in teacher's assignments
                    const filteredData = dataArray.filter(a => myAssignmentIds.includes(String(a.id)));
                    setSectionAssignments(filteredData);

                    if (dayEntries.length > 0) {
                        const loadedEntries = dayEntries.map(e => ({
                            start_time: e.start_time?.slice(0, 5) || "",
                            end_time: e.end_time?.slice(0, 5) || "",
                            teacher_assignment_id: e.teacher_assignment_id || "",
                            title: e.title || "",
                            is_break: e.is_break || false
                        }));

                        const currentDay = dayjs().format("dddd").toLowerCase();
                        const currentTime = dayjs().format("HH:mm");
                        const isToday = dayOfWeek === currentDay;

                        const visible = [];
                        const hidden = [];

                        loadedEntries.forEach(e => {
                            if (e.is_break) {
                                hidden.push(e);
                            } else if (isToday && e.end_time < currentTime) {
                                hidden.push(e);
                            } else if (e.teacher_assignment_id && !myAssignmentIds.includes(String(e.teacher_assignment_id))) {
                                hidden.push(e);
                            } else {
                                visible.push(e);
                            }
                        });

                        if (visible.length === 0) {
                            visible.push({ start_time: "09:00", end_time: "10:00", teacher_assignment_id: "", title: "", is_break: false });
                        }

                        setEntries(visible);
                        setHiddenEntries(hidden);
                    } else {
                        setEntries([{ start_time: "09:00", end_time: "10:00", teacher_assignment_id: "", title: "", is_break: false }]);
                        setHiddenEntries([]);
                    }
                }
            } catch (err) {
                console.error(err);
                setSectionAssignments([]);
            }
        }
        loadAssignmentsAndTimetable();
    }, [classSection, dayOfWeek, open]);

    const handleAddEntry = () => {
        setEntries([
            ...entries,
            { start_time: "09:00", end_time: "10:00", teacher_assignment_id: "", title: "", is_break: false }
        ]);
    };

    const handleRemoveEntry = (index) => {
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleOpenSubstituteModal = async (index) => {
        const entry = entries[index];
        if (!entry.start_time || !entry.end_time) {
            setError("Please select start and end time before switching teacher.");
            return;
        }

        const [, sectionId] = classSection.split(",");
        setActivePeriodIndex(index);
        setSubstituteModalOpen(true);
        setLoadingSubstitute(true);

        try {
            const res = await getSubstituteTeachers(sectionId, dayOfWeek, entry.start_time, entry.end_time);
            setSubstituteTeachers(res?.data?.data ?? res?.data ?? []);
        } catch (err) {
            console.error("Failed to load substitute teachers:", err);
            setError("Failed to load available teachers.");
        } finally {
            setLoadingSubstitute(false);
        }
    };

    const handleSelectSubstitute = (teacherAssignmentId) => {
        handleEntryChange(activePeriodIndex, "teacher_assignment_id", teacherAssignmentId);
        
        // Also ensure this assignment is in sectionAssignments so the dropdown displays correctly
        const selected = substituteTeachers.find(t => t.id === teacherAssignmentId);
        if (selected && !sectionAssignments.some(a => a.id === teacherAssignmentId)) {
            setSectionAssignments(prev => [...prev, selected]);
        }
        
        setSubstituteModalOpen(false);
        setActivePeriodIndex(null);
    };

    const handleSubmit = async () => {
        if (!classSection) {
            setError("Please select a class & section");
            return;
        }

        const invalid = entries.find((e) => !e.is_break && !e.teacher_assignment_id);
        if (invalid) {
            setError("Please select a teacher assignment for all non-break periods");
            return;
        }

        const [classId, sectionId] = classSection.split(",");
        const currentSchoolId = classTeacherSections[0]?.school_id || 1; 

        // Combine hidden (breaks, past periods) with visible
        const payload = {
            school_id: currentSchoolId,
            class_id: parseInt(classId),
            section_id: parseInt(sectionId),
            day_of_week: dayOfWeek,
            entries: [...entries, ...hiddenEntries].map(e => {
                const entryData = {
                    start_time: e.start_time,
                    end_time: e.end_time,
                    is_break: e.is_break,
                };
                if (e.title) entryData.title = e.title;
                if (!e.is_break && e.teacher_assignment_id) {
                    entryData.teacher_assignment_id = parseInt(e.teacher_assignment_id);
                }
                return entryData;
            })
        };

        try {
            setLoading(true);
            setError(null);
            await saveTimetable(payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to save timetable");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={onClose} edge="start" sx={{ mr: 1 }}>
                    <ArrowBack />
                </IconButton>
                Manage Class Timetable
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Stack direction="row" spacing={2} sx={{ mb: 4, mt: 1 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Class & Section</InputLabel>
                        <Select
                            value={classSection}
                            onChange={(e) => setClassSection(e.target.value)}
                            label="Class & Section"
                        >
                            {classOptions.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Day</InputLabel>
                        <Select
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value)}
                            label="Day"
                        >
                            <MenuItem value="monday">Monday</MenuItem>
                            <MenuItem value="tuesday">Tuesday</MenuItem>
                            <MenuItem value="wednesday">Wednesday</MenuItem>
                            <MenuItem value="thursday">Thursday</MenuItem>
                            <MenuItem value="friday">Friday</MenuItem>
                            <MenuItem value="saturday">Saturday</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <Divider sx={{ mb: 3 }}>Periods</Divider>

                {entries.map((entry, index) => (
                    <Box 
                        key={index} 
                        sx={{ 
                            p: 2.5, 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: 3, 
                            mb: 2,
                            position: 'relative',
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ 
                                bgcolor: 'primary.main', 
                                color: 'white', 
                                px: 1.5, 
                                py: 0.5, 
                                borderRadius: 10,
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                Period {index + 1}
                            </Typography>
                            {entries.length > 1 && (
                                <IconButton 
                                    size="small" 
                                    color="error" 
                                    onClick={() => handleRemoveEntry(index)}
                                    sx={{ bgcolor: 'error.lighter', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            )}
                        </Stack>
                        
                        <Stack spacing={2.5}>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Start Time"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={entry.start_time}
                                    onChange={(e) => handleEntryChange(index, "start_time", e.target.value)}
                                />
                                <TextField
                                    label="End Time"
                                    type="time"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={entry.end_time}
                                    onChange={(e) => handleEntryChange(index, "end_time", e.target.value)}
                                />
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <FormControl fullWidth size="small">
                                    <InputLabel>Subject & Teacher Assignment</InputLabel>
                                    <Select
                                        value={entry.teacher_assignment_id || ""}
                                        onChange={(e) => handleEntryChange(index, "teacher_assignment_id", e.target.value)}
                                        label="Subject & Teacher Assignment"
                                    >
                                        <MenuItem value="">
                                            <em>Select assignment</em>
                                        </MenuItem>
                                        {sectionAssignments.map((a) => {
                                            // Availability check based on logged-in teacher's timetable
                                            const isMyAssignment = teacherAssignments.some(ta => String(ta.id) === String(a.id));
                                            let isBusy = false;
                                            
                                            if (isMyAssignment && teacherTimetable && teacherTimetable[dayOfWeek]) {
                                                const daySchedule = teacherTimetable[dayOfWeek];
                                                isBusy = daySchedule.some(p => {
                                                    if (p.is_break) return false;
                                                    const currentClassId = classSection.split(",")[0];
                                                    const currentSectionId = classSection.split(",")[1];
                                                    if (String(p.class_id) === String(currentClassId) && String(p.section_id) === String(currentSectionId)) {
                                                        return false; // same class/section slot
                                                    }
                                                    
                                                    const pStart = p.start_time?.slice(0, 5);
                                                    const pEnd = p.end_time?.slice(0, 5);
                                                    const eStart = entry.start_time;
                                                    const eEnd = entry.end_time;
                                                    
                                                    if (!eStart || !eEnd || !pStart || !pEnd) return false;
                                                    
                                                    return pStart < eEnd && pEnd > eStart;
                                                });
                                            }

                                            if (isBusy) return null; // Prevent double booking

                                            const subjectName = a.Subject?.name || a.subject?.name || "Subject";
                                            const teacherName =
                                                a.Teacher?.User?.name ||
                                                a.teacher?.user?.name ||
                                                a.teacher?.User?.name ||
                                                "Teacher";
                                            return (
                                                <MenuItem key={a.id} value={a.id}>
                                                    {subjectName} - {teacherName}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                                <IconButton 
                                    color="primary" 
                                    onClick={() => handleOpenSubstituteModal(index)}
                                    title="Switch Teacher"
                                    sx={{ bgcolor: 'action.hover' }}
                                >
                                    <SwapVert />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Box>
                ))}

                <Button
                    startIcon={<Add />}
                    onClick={handleAddEntry}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Add Period
                </Button>
            </DialogContent>
            
            <DialogActions sx={{ p: 2.5, bgcolor: 'background.default' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading}
                    sx={{ px: 3, fontWeight: 600, borderRadius: 2, boxShadow: 'none' }}
                >
                    {loading ? "Saving..." : "Save Day"}
                </Button>
            </DialogActions>
        </Dialog>

        {/* Substitute Teacher Selection Modal */}
        <Dialog 
            open={substituteModalOpen} 
            onClose={() => setSubstituteModalOpen(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider' }}>
                Available Teachers
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {loadingSubstitute ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">Loading teachers...</Typography>
                    </Box>
                ) : substituteTeachers.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">No teachers are available for this period.</Typography>
                    </Box>
                ) : (
                    <Stack divider={<Divider />} sx={{ mt: 1 }}>
                        {substituteTeachers.map(teacher => {
                            const isBusy = teacher.is_busy;
                            const subjectName = teacher.Subject?.name || teacher.subject?.name || "Subject";
                            const teacherName = teacher.Teacher?.User?.name || teacher.teacher?.user?.name || teacher.teacher?.User?.name || "Teacher";
                            
                            return (
                                <Box 
                                    key={teacher.id}
                                    sx={{ 
                                        p: 2, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        bgcolor: isBusy ? 'action.hover' : 'transparent',
                                        opacity: isBusy ? 0.7 : 1,
                                        cursor: isBusy ? 'not-allowed' : 'pointer',
                                        '&:hover': {
                                            bgcolor: isBusy ? 'action.hover' : 'action.selected'
                                        }
                                    }}
                                    onClick={() => !isBusy && handleSelectSubstitute(teacher.id)}
                                >
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {isBusy ? <Cancel color="error" fontSize="small" /> : <CheckCircle color="success" fontSize="small" />}
                                            {teacherName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {subjectName} • Status: {isBusy ? "Busy" : "Available"}
                                        </Typography>
                                        {isBusy && teacher.busy_details && (
                                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                                Currently Handling: Class {teacher.busy_details.class_name} {teacher.busy_details.section_name} <br/>
                                                Time: {teacher.busy_details.start_time?.slice(0, 5)} - {teacher.busy_details.end_time?.slice(0, 5)}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setSubstituteModalOpen(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
        </>
    );
}
