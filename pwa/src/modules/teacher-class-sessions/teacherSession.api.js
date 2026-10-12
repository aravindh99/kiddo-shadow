import api from "../../api/axios";

export const startClassSession = async (data) => {
    const payload = normalizeStartPayload(data);
    try {
        return await api.post("/teacher-class-sessions/start", payload);
    } catch (error) {
        const status = error?.response?.status;
        const isPayloadIssue = status === 400 || status === 422;
        if (!isPayloadIssue) throw error;

        const fallbackPayload = {
            timetable_id: payload.timetable_id,
            teacher_assignment_id: payload.teacher_assignment_id ?? payload.assignment_id,
            assignment_id: payload.assignment_id ?? payload.teacher_assignment_id,
            class_id: payload.class_id,
            section_id: payload.section_id,
            subject_id: payload.subject_id,
        };

        return api.post("/teacher-class-sessions/start", fallbackPayload);
    }
};

export const endClassSession = (sessionId) =>
    api.post(`/teacher-class-sessions/${sessionId}/end`);

export const listClassSessions = (date) =>
    api.get("/teacher-class-sessions", { params: date ? { date } : {} });

export const markSessionAttendance = async (sessionId, records) => {
    const normalizedSessionId = Number(sessionId);
    const normalizedRecords = (records || [])
        .map((r) => ({
            student_id: Number(r.student_id),
            status: String(r.status || "").trim().toLowerCase().replace(/\s+/g, "_"),
        }))
        .filter(
            (r) =>
                Number.isInteger(r.student_id) &&
                r.student_id > 0 &&
                ["present", "absent", "leave", "on_duty"].includes(r.status)
        );

    const payload = {
        teacher_class_session_id: normalizedSessionId,
        records: normalizedRecords,
    };

    try {
        return await api.post("/teachers/attendance", payload);
    } catch (error) {
        const status = error?.response?.status;
        const isPayloadIssue = status === 400 || status === 422;
        if (!isPayloadIssue) throw error;

        const fallbackPayload = {
            session_id: normalizedSessionId,
            attendance_records: normalizedRecords,
        };

        return api.post("/teachers/attendance", fallbackPayload);
    }
};

export const listStudentsBySection = (classId, sectionId) =>
    api.get("/students", {
        params: {
            class_id: classId,
            section_id: sectionId,
            limit: 500,
        },
    });

function normalizeStartPayload(data = {}) {
    const toInt = (v) => {
        const n = Number.parseInt(v, 10);
        return Number.isFinite(n) && n > 0 ? n : undefined;
    };

    return {
        timetable_id: toInt(data.timetable_id),
        teacher_assignment_id: toInt(
            data.teacher_assignment_id ?? data.assignment_id ?? data.teacherAssignmentId
        ),
        assignment_id: toInt(
            data.assignment_id ?? data.teacher_assignment_id ?? data.teacherAssignmentId
        ),
        class_id: toInt(data.class_id),
        section_id: toInt(data.section_id),
        subject_id: toInt(data.subject_id),
    };
}
