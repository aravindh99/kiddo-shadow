import { z } from "zod";

const attendanceStatus = z.enum(["present", "absent", "leave", "on_duty"]);

const attendanceRecordSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;

  const row = value;
  const normalized = {
    ...row,
    student_id: row.student_id ?? row.studentId ?? row.id,
  };

  if (normalized.status == null && typeof row.present === "boolean") {
    normalized.status = row.present ? "present" : "absent";
  } else if (normalized.status != null) {
    normalized.status = String(normalized.status).trim().toLowerCase().replace(/\s+/g, "_");
  }

  return normalized;
}, z.object({
  student_id: z.coerce.number().int().positive(),
  status: attendanceStatus,
}));

export const markAttendanceSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;

  const payload = value;
  return {
    ...payload,
    teacher_class_session_id:
      payload.teacher_class_session_id ??
      payload.teacherClassSessionId ??
      payload.class_session_id ??
      payload.session_id,
    records: payload.records ?? payload.attendance ?? payload.students,
  };
}, z.object({
  teacher_class_session_id: z.coerce.number().int().positive(),
  records: z.array(attendanceRecordSchema).min(1),
}));

export const attendanceSummarySchema = z.object({
  query: z.object({
    class_id: z.string().optional(),
    section_id: z.string().optional(),
    student_id: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});
