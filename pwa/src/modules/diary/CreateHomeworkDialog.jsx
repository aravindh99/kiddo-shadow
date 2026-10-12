import { useEffect, useMemo, useState } from "react";
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
    CircularProgress
} from "@mui/material";
import { useTeacherTimetable } from "../teacher-timetable/useTeacherTimetable";
import { getMyTeacherAssignments } from "../teacher-timetable/teacherTimetable.api";
import { createHomework, updateHomework } from "./diary.api";

export default function CreateHomeworkDialog({
    open,
    onClose,
    onSuccess,
    prefill,
    editItem,
    lockClassSection = false,
}) {
    const { timetable } = useTeacherTimetable();
    const [assignments, setAssignments] = useState([]);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [urlError, setUrlError] = useState("");

    const getTodayDate = () => {
        const d = new Date();
        return d.toISOString().split("T")[0];
    };

    const [formData, setFormData] = useState({
        class_section: "",
        subject_id: "",
        teacher_assignment_id: "",
        homework_date: getTodayDate(),
        title: "",
        due_date: "",
        attachment_url: "",
        description: "",
    });

    useEffect(() => {
        if (!open) return;
        setFormData((prev) => ({
            ...prev,
            homework_date: getTodayDate(),
        }));
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (editItem) {
            setFormData({
                class_section: `${editItem.class_id},${editItem.section_id}`,
                subject_id: editItem.subject_id || "",
                teacher_assignment_id: editItem.teacher_assignment_id || "",
                homework_date: editItem.homework_date || getTodayDate(),
                title: editItem.title || "",
                due_date: editItem.due_date || "",
                attachment_url: editItem.attachment_url || "",
                description: editItem.description || "",
            });
            return;
        }
        if (prefill) {
            const classId = prefill?.class_id ?? prefill?.classId;
            const sectionId = prefill?.section_id ?? prefill?.sectionId;
            setFormData((prev) => ({
                ...prev,
                class_section:
                    classId && sectionId ? `${classId},${sectionId}` : prev.class_section,
                subject_id: prefill?.subject_id ?? prefill?.subjectId ?? prev.subject_id,
                teacher_assignment_id:
                    prefill?.teacher_assignment_id ??
                    prefill?.teacherAssignmentId ??
                    prev.teacher_assignment_id,
            }));
        }
    }, [open, prefill, editItem]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;

        async function loadAssignments() {
            try {
                setAssignmentsLoading(true);
                const res = await getMyTeacherAssignments();
                const items = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
                if (!cancelled) setAssignments(Array.isArray(items) ? items : []);
            } catch (err) {
                console.warn("Failed to load teacher assignments", err);
                if (!cancelled) setAssignments([]);
            } finally {
                if (!cancelled) setAssignmentsLoading(false);
            }
        }

        loadAssignments();
        return () => {
            cancelled = true;
        };
    }, [open]);

    const slots = useMemo(() => {
        const timetableSlots = Array.isArray(timetable)
            ? timetable
            : Object.values(timetable || {}).flat();
        const assignmentSlots = (assignments || []).map((a) => ({
            class_id: a.class_id,
            section_id: a.section_id,
            subject_id: a.subject_id,
            teacher_assignment_id: a.id,
            class: a.Class || a.class,
            section: a.Section || a.section,
            subject: a.Subject || a.subject,
        }));
        return [...timetableSlots, ...assignmentSlots];
    }, [timetable, assignments]);

    // Extract unique (class, section) pairs
    const classOptions = useMemo(() => {
        if (!slots.length) return [];
        const unique = new Map();
        slots.forEach((t) => {
            const classId = t.class_id || t.class?.id || t.Class?.id;
            const sectionId = t.section_id || t.section?.id || t.Section?.id;
            if (classId && sectionId) {
                const key = `${classId},${sectionId}`;
                if (!unique.has(key)) {
                    unique.set(key, {
                        class_id: classId,
                        section_id: sectionId,
                        label: `${t.class?.class_name || t.class?.name || t.Class?.class_name || t.class_id} - ${t.section?.name || t.Section?.name || t.section_id}`,
                    });
                }
            }
        });
        return Array.from(unique.values());
    }, [slots]);

    // Extract subjects for the selected class/section
    const subjectOptions = useMemo(() => {
        if (!formData.class_section || !slots.length) return [];
        const [classId, sectionId] = formData.class_section.split(",").map(Number);

        const relevantEntries = slots.filter((t) => {
            const entryClassId = t.class_id || t.class?.id || t.Class?.id;
            const entrySectionId = t.section_id || t.section?.id || t.Section?.id;
            return (
                String(entryClassId) === String(classId) &&
                String(entrySectionId) === String(sectionId) &&
                (t.Subject || t.subject)
            );
        });

        const unique = new Map();
        relevantEntries.forEach((t) => {
            const assignmentId = t.teacher_assignment_id || t.id;
            const subjectId = t.subject_id || t.Subject?.id || t.subject?.id;
            const name = t.Subject?.name || t.subject?.name;
            if (assignmentId && subjectId && name && !unique.has(assignmentId)) {
                unique.set(assignmentId, { assignmentId, subjectId, name });
            }
        });

        return Array.from(unique.values());
    }, [formData.class_section, slots]);

    useEffect(() => {
        if (!formData.class_section) return;
        if (subjectOptions.length === 1) {
            const only = subjectOptions[0];
            setFormData((prev) => ({
                ...prev,
                subject_id: only.subjectId,
                teacher_assignment_id: only.assignmentId,
            }));
        }
    }, [formData.class_section, subjectOptions]);


    const validateAttachmentUrl = (url) => {
        if (!url) return "";

        try {
            const parsed = new URL(url);

            if (parsed.protocol !== "https:") {
                return "Invalid URL. Please use HTTPS link only.";
            }

            return "";
        } catch {
            return "Invalid URL. Please use HTTPS link only.";
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "subject_id") {
            const selected = subjectOptions.find(
                (opt) => String(opt.assignmentId) === String(value)
            );
            setFormData({
                ...formData,
                subject_id: selected ? selected.subjectId : "",
                teacher_assignment_id: selected ? selected.assignmentId : "",
            });
            return;
        }
        if (name === "attachment_url") {
            const errorMsg = validateAttachmentUrl(value);
            setUrlError(errorMsg);

            setFormData({
                ...formData,
                attachment_url: value,
            });

            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        if (
            !formData.class_section ||
            !formData.subject_id ||
            !formData.teacher_assignment_id ||
            !formData.title ||
            !formData.due_date ||
            !formData.description
        ) {
            setError("Please fill all mandatory fields (Title, Due Date, Subject, Description)");
            return;
        }

        const attachmentError = validateAttachmentUrl(formData.attachment_url);
        if (attachmentError) {
            setUrlError(attachmentError);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [classId, sectionId] = formData.class_section.split(",");

            const payload = {
                class_id: parseInt(classId),
                section_id: parseInt(sectionId),
                subject_id: formData.subject_id ? Number(formData.subject_id) : undefined,
                teacher_assignment_id: Number(formData.teacher_assignment_id),
                homework_date: formData.homework_date || getTodayDate(),
                title: formData.title,
                due_date: formData.due_date,
                attachment_url: formData.attachment_url || undefined,
                description: formData.description,
            };

            if (editItem?.id) {
                await updateHomework(editItem.id, payload);
            } else {
                await createHomework(payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(editItem ? "Failed to update homework" : "Failed to create homework");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={!loading ? onClose : undefined}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }
            }}
        >
            <DialogTitle sx={{ pb: 1, fontWeight: "bold" }}>
                {editItem ? "Edit Homework" : "Assign Homework"}
                <div style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#666", marginTop: 4 }}>
                    Assigned Today
                </div>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                    {!classOptions.length && !assignmentsLoading && (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            No assigned classes found. Ask the school admin to assign your
                            classes/subjects or create your timetable first.
                        </Alert>
                    )}

                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Class & Section</InputLabel>
                        <Select
                            name="class_section"
                            label="Class & Section"
                            value={formData.class_section}
                            onChange={handleChange}
                            disabled={!classOptions.length || lockClassSection || loading}
                            sx={{ borderRadius: 2 }}
                        >
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

                    <FormControl fullWidth variant="outlined" disabled={!formData.class_section || loading}>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            name="subject_id"
                            label="Subject"
                            value={formData.teacher_assignment_id}
                            onChange={handleChange}
                            sx={{ borderRadius: 2 }}
                        >
                            {subjectOptions.map((opt) => (
                                <MenuItem key={opt.assignmentId} value={opt.assignmentId}>
                                    {opt.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        name="title"
                        label="Homework Title *"
                        fullWidth
                        value={formData.title}
                        onChange={handleChange}
                        disabled={loading}
                        sx={{
                            "& .MuiOutlinedInput-root": { borderRadius: 2 }
                        }}
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            name="due_date"
                            label="Due Date *"
                            type="date"
                            fullWidth
                            value={formData.due_date}
                            onChange={handleChange}
                            disabled={loading}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2 }
                            }}
                        />
                        <TextField
                            name="attachment_url"
                            label="Attachment URL (Optional)"
                            placeholder="https://..."
                            fullWidth
                            value={formData.attachment_url}
                            onChange={handleChange}
                            disabled={loading}
                            error={Boolean(urlError)}
                            helperText={urlError}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Stack>

                    <TextField
                        name="description"
                        label="Homework Description *"
                        fullWidth
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2
                            }
                        }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
                <Button onClick={onClose} disabled={loading} color="inherit" sx={{ borderRadius: 2, px: 3 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.class_section || !formData.subject_id || !formData.description}
                    sx={{ borderRadius: 2, px: 4, py: 1 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : (editItem ? "Save Changes" : "Assign Homework")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
