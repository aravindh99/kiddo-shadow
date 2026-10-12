import { useState, useMemo, useEffect } from "react";
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
    Alert
} from "@mui/material";
import { useTeacherAssignments } from "../teacher-timetable/useTeacherAssignments";
import { createNotification } from "./notifications.api";

export default function CreateNotificationDialog({ open, onClose, onSuccess }) {
    const { assignments } = useTeacherAssignments();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        target_role: "student",
        class_section: "", // Combined value "classId,sectionId"
        category: "Announcement",
        priority_level: "Low",
    });

    // Deduplicate classes from assignments
    const classOptions = useMemo(() => {
        if (!assignments || !Array.isArray(assignments)) return [];
        const unique = new Map();
        assignments.forEach((a) => {
            if (a.class_id && a.section_id) {
                const key = `${a.class_id},${a.section_id}`;
                if (!unique.has(key)) {
                    unique.set(key, {
                        class_id: a.class_id,
                        section_id: a.section_id,
                        label: `${a.Class?.class_name || a.class?.name || a.class_id} - ${a.Section?.name || a.section?.name || a.section_id}`,
                    });
                }
            }
        });
        return Array.from(unique.values());
    }, [assignments]);

    // Automatically select the class if the teacher only has 1 assigned class
    useEffect(() => {
        if (classOptions.length === 1 && !formData.class_section) {
            setFormData(prev => ({
                ...prev,
                class_section: `${classOptions[0].class_id},${classOptions[0].section_id}`
            }));
        }
    }, [classOptions]);

    const handleChange = (e) => {
        let val = e.target.value;
        if ((e.target.name === 'title' || e.target.name === 'message') && val.length > 0) {
            // Capitalize the first letter of every word for both title and message
            val = val.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.message) {
            setError("Please fill all required fields");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = {
                title: formData.title,
                message: formData.message,
                target_role: formData.target_role,
                category: formData.category,
                priority_level: formData.priority_level,
            };

            if (formData.class_section) {
                const [classId, sectionId] = formData.class_section.split(",");
                payload.class_id = parseInt(classId);
                payload.section_id = parseInt(sectionId);
            }

            await createNotification(payload);
            window.dispatchEvent(new Event("notifications:refresh"));
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to create announcement");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        name="title"
                        label="Title"
                        fullWidth
                        value={formData.title}
                        onChange={handleChange}
                    />

                    <TextField
                        name="message"
                        label="Message"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.message}
                        onChange={handleChange}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Target Audience</InputLabel>
                        <Select
                            name="target_role"
                            label="Target Audience"
                            value={formData.target_role}
                            onChange={handleChange}
                        >
                            <MenuItem value="student">Students</MenuItem>
                            <MenuItem value="parent">Parents</MenuItem>
                            <MenuItem value="all">Everyone (Students & Parents)</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel id="target-class-label" shrink>Target Class (Optional)</InputLabel>
                        <Select
                            labelId="target-class-label"
                            name="class_section"
                            label="Target Class (Optional)"
                            value={formData.class_section}
                            onChange={handleChange}
                        >
                            <MenuItem value="">
                                <em>All my associated classes</em>
                            </MenuItem>
                            {classOptions.map((opt) => (
                                <MenuItem
                                    key={`${opt.class_id},${opt.section_id}`}
                                    value={`${opt.class_id},${opt.section_id}`}
                                >
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? "Creating..." : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
