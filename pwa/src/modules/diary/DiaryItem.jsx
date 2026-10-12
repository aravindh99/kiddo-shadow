import { useEffect, useState, useMemo } from "react";
import { Paper, Typography, Stack, Box, IconButton, Divider, Chip, Accordion, AccordionSummary, AccordionDetails, Avatar } from "@mui/material";
import { Edit, Delete, Assignment, ExpandMore, CheckCircle, RadioButtonUnchecked, AttachFile } from "@mui/icons-material";
import { markHomeworkAsRead } from "./diary.api";

export default function DiaryItem({ item, onEdit, onDelete, canEdit, user, studentId }) {
  const isToday = item.homework_date === new Date().toISOString().split("T")[0];
  const assignedDateStr = isToday ? "Assigned Today" : `Assigned: ${item.homework_date}`;
  const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "";

  // Get the current student's read status
  const currentReadStatus = item.homework_read_statuses?.find(s => String(s.student_id) === String(studentId));
  const isStudent = user?.role === "student";
  const isParent = user?.role === "parent";

  const [hasRead, setHasRead] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (currentReadStatus) {
      if (isStudent && currentReadStatus.student_read_at) setHasRead(true);
      if (isParent && currentReadStatus.parent_read_at) setHasRead(true);
    }
  }, [currentReadStatus, isStudent, isParent]);

  const handleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Trigger read API only if the user expands for the first time and it's not a teacher
    if (newExpanded && !canEdit && studentId && !hasRead) {
      markHomeworkAsRead(item.id, studentId).catch(() => {});
      setHasRead(true);
    }
  };

      // Teacher Analytics
  const teacherStats = useMemo(() => {
    if (!canEdit) return null;
    
    // Students list from Section.students
    const sectionData = item.section || item.Section;
    const students = sectionData?.students || sectionData?.Students || [];
    const total = students.length;
    
    let readCount = 0;
    const studentList = students.map(student => {
      const status = item.homework_read_statuses?.find(s => String(s.student_id) === String(student.id));
      if (status?.student_read_at) readCount++;
      return {
        ...student,
        read_at: status?.student_read_at,
        parent_read_at: status?.parent_read_at
      };
    });

    const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;

    return { total, readCount, unread: total - readCount, percent, studentList };
  }, [canEdit, item]);

  // Due Date parsing
  const isDueTomorrow = () => {
    if (!item.due_date) return false;
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return item.due_date === tmr.toISOString().split("T")[0];
  };

  const isDueToday = () => {
    if (!item.due_date) return false;
    return item.due_date === new Date().toISOString().split("T")[0];
  };

  const isOverdue = () => {
    if (!item.due_date) return false;
    return new Date(item.due_date) < new Date(new Date().toISOString().split("T")[0]);
  };

  const subjectName = item.subject?.name || item.Subject?.name;
  const className = item.class?.class_name || item.Class?.class_name;
  const sectionName = item.section?.name || item.Section?.name;
  const teacherName = item.user?.name || item.User?.name || "Teacher";

  return (
    <Paper sx={{ p: 0, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", border: "1px solid", borderColor: "grey.100" }}>
      <Box sx={{ p: 2.5, cursor: "pointer" }} onClick={handleExpand}>
        <Stack spacing={2}>
          {/* Header Row */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: "primary.light", width: 40, height: 40 }}>
                <Assignment sx={{ color: "primary.main" }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                  {item.title || subjectName || "Homework Assignment"}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {subjectName} • By {teacherName}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {canEdit && (
                <Box onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => onEdit(item)} color="primary">
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(item)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              )}
              <ExpandMore 
                sx={{ 
                  color: "text.secondary", 
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", 
                  transition: "transform 0.3s" 
                }} 
              />
            </Box>
          </Box>

          {/* Badges Row */}
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              label={isToday ? `Assigned Today${timeStr ? ` • ${timeStr}` : ""}` : `Assigned: ${new Date(item.homework_date).toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}${timeStr ? ` • ${timeStr}` : ""}`}
              size="small" 
              sx={{ bgcolor: "grey.100", color: "text.secondary", fontWeight: 500 }} 
            />
            {item.due_date && (
              <Chip 
                label={`Due: ${new Date(item.due_date).toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`}
                size="small"
                color={isOverdue() ? "error" : isDueToday() ? "warning" : isDueTomorrow() ? "info" : "default"}
                variant={isOverdue() || isDueToday() || isDueTomorrow() ? "filled" : "outlined"}
                sx={{ fontWeight: 600 }}
              />
            )}
            
            {/* Status Badges for Student/Parent */}
            {!canEdit && (
              hasRead ? (
                <Chip icon={<CheckCircle fontSize="small" />} label="Read" size="small" color="success" variant="outlined" />
              ) : (
                <Chip label="New" size="small" color="primary" />
              )
            )}
          </Box>

          {/* Expandable Content Area */}
          {isExpanded && (
            <Box onClick={(e) => e.stopPropagation()}>
              <Divider sx={{ my: 2 }} />
              
              {/* Content */}
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.primary", lineHeight: 1.6 }}>
                {item.description}
              </Typography>

              {/* Attachment */}
              {item.attachment_url && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<AttachFile fontSize="small" />}
                    label="View Attachment"
                    clickable
                    component="a"
                    href={item.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
              )}

              {/* Footer Info */}
              <Box display="flex" justifyContent="space-between" alignItems="center" pt={2}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Assigned to: {className || ""} {sectionName ? `${sectionName}` : ""}
                </Typography>
                
                {/* Parent read status for parents */}
                {isParent && currentReadStatus?.parent_read_at && (
                  <Typography variant="caption" color="success.main" fontWeight={600} display="flex" alignItems="center" gap={0.5}>
                    <CheckCircle sx={{ fontSize: 14 }} /> Viewed by Parent
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Teacher Tracking Accordion */}
      {canEdit && teacherStats && (
        <Accordion disableGutters elevation={0} sx={{ borderTop: "1px solid", borderColor: "grey.100", '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "grey.50" }}>
            <Box display="flex" justifyContent="space-between" width="100%" alignItems="center" pr={2}>
              <Typography variant="subtitle2" fontWeight={600}>Track Status</Typography>
              <Typography variant="caption" fontWeight={600} color={teacherStats.percent === 100 ? "success.main" : "text.secondary"}>
                {teacherStats.readCount}/{teacherStats.total} Read ({teacherStats.percent}%)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: "grey.50", p: 0 }}>
            <Divider />
            {teacherStats.studentList.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: "block", textAlign: "center" }}>
                No students found in this section.
              </Typography>
            ) : (
              <Stack divider={<Divider />} sx={{ maxHeight: 300, overflowY: "auto" }}>
                {teacherStats.studentList.map(s => (
                  <Box key={s.id} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{s.user?.name || s.first_name || "Student"}</Typography>
                      <Typography variant="caption" color="text.secondary">Adm: {s.admission_no}</Typography>
                    </Box>
                    <Box textAlign="right">
                      {s.read_at ? (
                        <Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5} justifyContent="flex-end" fontWeight={600}>
                          <CheckCircle sx={{ fontSize: 14 }} /> {new Date(s.read_at).toLocaleDateString()} {new Date(s.read_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} justifyContent="flex-end">
                          <RadioButtonUnchecked sx={{ fontSize: 14 }} /> Not Read
                        </Typography>
                      )}
                      
                      {/* Parent Read */}
                      {s.parent_read_at ? (
                        <Typography variant="caption" color="primary.main" display="flex" alignItems="center" gap={0.5} justifyContent="flex-end" sx={{ mt: 0.5 }}>
                          Parent: {new Date(s.parent_read_at).toLocaleDateString()} {new Date(s.parent_read_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled" display="flex" alignItems="center" gap={0.5} justifyContent="flex-end" sx={{ mt: 0.5 }}>
                          Parent: Not Read
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
}
