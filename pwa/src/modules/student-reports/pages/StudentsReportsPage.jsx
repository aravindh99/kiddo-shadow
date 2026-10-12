import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  MenuBook,
  People,
  Search,
} from "@mui/icons-material";
import TopicDetailDialog from "../components/TopicDetailDialog";
import {
  getTeacherAssignments,
  getTeacherAttendanceSummary,
  getTeacherSectionStudents,
  getTeacherStudentReports,
} from "../studentReports.api";
import {
  buildAttendanceMap,
  buildClassTeacherScopes,
  buildStudentAnalytics,
  buildSubjectTeacherScopes,
  filterStudentsByTeacher,
  getFallbackHint,
  getInitialRoleMode,
  getInitialScopeKey,
  getScopeByKey,
  getStudentDetailSections,
  sortStudentsForRole,
} from "../studentReports.logic";

const badgeColorMap = {
  "Top Performer": "success",
  "Needs Improvement": "error",
};

export default function StudentsReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceItems, setAttendanceItems] = useState([]);
  const [serverAnalytics, setServerAnalytics] = useState(null);
  const [roleMode, setRoleMode] = useState("class_teacher");
  const [scopeKey, setScopeKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedTopicData, setSelectedTopicData] = useState(null);
  const [selectedTopicStudentName, setSelectedTopicStudentName] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const reportPayload = await getTeacherStudentReports().catch(() => null);
        if (
          reportPayload
          && Array.isArray(reportPayload.assignments)
          && Array.isArray(reportPayload.students)
          && Array.isArray(reportPayload.analytics)
        ) {
          if (!active) return;
          setAssignments(reportPayload.assignments);
          setStudents(reportPayload.students);
          setAttendanceItems([]);
          setServerAnalytics(reportPayload.analytics);
          return;
        }

        const assignmentRows = await getTeacherAssignments();
        if (!active) return;
        setAssignments(Array.isArray(assignmentRows) ? assignmentRows : []);
        setServerAnalytics(null);

        const uniqueScopes = Array.from(
          new Map(
            (Array.isArray(assignmentRows) ? assignmentRows : []).map((assignment) => {
              const classId = Number(assignment?.class_id || assignment?.Class?.id || assignment?.class?.id || 0);
              const sectionId = Number(assignment?.section_id || assignment?.Section?.id || assignment?.section?.id || 0);
              return [`${classId}-${sectionId}`, { class_id: classId, section_id: sectionId }];
            })
          ).values()
        ).filter((scope) => scope.class_id && scope.section_id);

        const [studentGroups, attendanceRows] = await Promise.all([
          Promise.all(uniqueScopes.map((scope) => getTeacherSectionStudents(scope).catch(() => []))),
          getTeacherAttendanceSummary({ limit: 2000 }).catch(() => []),
        ]);

        if (!active) return;

        const studentMap = new Map();
        studentGroups.flat().forEach((student) => {
          const studentId = Number(student?.id || 0);
          if (studentId) studentMap.set(studentId, student);
        });

        setStudents(Array.from(studentMap.values()));
        setAttendanceItems(Array.isArray(attendanceRows) ? attendanceRows : []);
      } catch (loadError) {
        console.error("Failed to load student reports", loadError);
        if (active) setError("Failed to load students reports.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const classTeacherScopes = useMemo(() => buildClassTeacherScopes(assignments), [assignments]);
  const subjectTeacherScopes = useMemo(() => buildSubjectTeacherScopes(assignments), [assignments]);

  useEffect(() => {
    const initialRole = getInitialRoleMode(classTeacherScopes, subjectTeacherScopes);
    setRoleMode((current) => current || initialRole);
  }, [classTeacherScopes, subjectTeacherScopes]);

  useEffect(() => {
    const nextScopeKey = getInitialScopeKey({
      roleMode,
      classTeacherScopes,
      subjectTeacherScopes,
    });

    setScopeKey((current) => {
      if (current) {
        const exists = getScopeByKey({ roleMode, scopeKey: current, classTeacherScopes, subjectTeacherScopes });
        if (exists) return current;
      }
      return nextScopeKey;
    });
  }, [roleMode, classTeacherScopes, subjectTeacherScopes]);

  const selectedScope = useMemo(
    () => getScopeByKey({ roleMode, scopeKey, classTeacherScopes, subjectTeacherScopes }),
    [roleMode, scopeKey, classTeacherScopes, subjectTeacherScopes]
  );

  const attendanceMap = useMemo(() => buildAttendanceMap(attendanceItems), [attendanceItems]);
  const analytics = useMemo(() => {
    if (Array.isArray(serverAnalytics)) return serverAnalytics;
    return buildStudentAnalytics({ students, assignments, attendanceMap });
  }, [serverAnalytics, students, assignments, attendanceMap]);

  const visibleStudents = useMemo(() => {
    const filtered = filterStudentsByTeacher({
      roleMode,
      selectedScope,
      students,
      analytics,
    });
    
    let sorted = sortStudentsForRole(filtered, roleMode);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      sorted = sorted.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.username.toLowerCase().includes(q)
      );
    }
    
    return sorted;
  }, [roleMode, selectedScope, students, analytics, searchQuery]);

  const fallbackHint = useMemo(() => getFallbackHint(visibleStudents), [visibleStudents]);

  const handleRoleChange = (_, value) => {
    setRoleMode(value);
    setScopeKey("");
  };

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, pb: 10 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Students Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Review student academic and attendance performance by teacher role.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {!classTeacherScopes.length && !subjectTeacherScopes.length ? (
          <Alert severity="info">No teacher assignments found for reports access.</Alert>
        ) : null}

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Tabs value={roleMode} onChange={handleRoleChange} variant="fullWidth">
              <Tab
                value="class_teacher"
                label="Class Teacher"
                icon={<People fontSize="small" />}
                iconPosition="start"
                disabled={!classTeacherScopes.length}
              />
              <Tab
                value="subject_teacher"
                label="Subject Teacher"
                icon={<MenuBook fontSize="small" />}
                iconPosition="start"
                disabled={!subjectTeacherScopes.length}
              />
            </Tabs>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>{roleMode === "class_teacher" ? "Class Scope" : "Subject Scope"}</InputLabel>
                  <Select
                    value={scopeKey}
                    label={roleMode === "class_teacher" ? "Class Scope" : "Subject Scope"}
                    onChange={(event) => setScopeKey(event.target.value)}
                  >
                    {(roleMode === "class_teacher" ? classTeacherScopes : subjectTeacherScopes).map((scope) => (
                      <MenuItem key={scope.key} value={scope.key}>
                        {scope.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search students by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {fallbackHint ? <Alert severity="info">{fallbackHint}</Alert> : null}
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: isMobile ? 'transparent' : 'white' }}>
          {isMobile ? (
            <Box>
              {visibleStudents.length === 0 ? (
                <Alert severity="info">No students available for the selected teacher scope.</Alert>
              ) : (
                visibleStudents.map((student) => {
                  const details = getStudentDetailSections({ roleMode, studentReport: student });
                  return (
                    <Card key={student.studentId} variant="outlined" sx={{ mb: 2, borderRadius: 2, bgcolor: "#fff" }}>
                      <CardContent sx={{ p: 2, pb: "16px !important" }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box>
                            <Typography fontWeight="bold">{student.name}</Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {student.username} • Class {student.className} • Sec {student.sectionName}
                            </Typography>
                          </Box>
                          <Chip 
                            label={`${student.attendancePct}%`} 
                            color={student.attendancePct < 75 ? "warning" : "success"} 
                            variant={student.attendancePct < 75 ? "filled" : "outlined"} 
                            size="small" 
                            sx={{ fontWeight: 600, ml: 1 }}
                          />
                        </Box>

                        {student.badge ? (
                          <Chip size="small" label={student.badge} color={badgeColorMap[student.badge] || "default"} sx={{ fontWeight: 600, mb: 2 }} />
                        ) : null}

                        <Grid container spacing={2}>
                          {roleMode === "class_teacher" ? (
                            <>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Overall Score</Typography>
                                <Chip 
                                  label={`${student.overallAverage}%`} 
                                  color={student.overallAverage >= 75 ? "success" : student.overallAverage < 40 ? "error" : "primary"} 
                                  size="small" 
                                  sx={{ fontWeight: 600 }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Strong Subjects</Typography>
                                {student.strongSubjects?.length ? (
                                  <Typography variant="body2" color="success.main" fontWeight={500}>
                                    {student.strongSubjects.map(s => s.subject).join(", ")}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">None</Typography>
                                )}
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Weak Subjects</Typography>
                                {student.weakSubjects?.length ? (
                                  <Typography variant="body2" color="error.main" fontWeight={500}>
                                    {student.weakSubjects.map(s => s.subject).join(", ")}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">None</Typography>
                                )}
                              </Grid>
                            </>
                          ) : (
                            <>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Subject Score</Typography>
                                <Chip 
                                  label={`${student.subjectSummary?.marks ?? 0}%`} 
                                  color={student.belowThreshold ? "error" : "primary"} 
                                  size="small" 
                                  sx={{ fontWeight: 600 }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Strong Topics</Typography>
                                {details.strongTopics?.length ? (
                                  <Typography variant="body2" color="success.main" fontWeight={500}>
                                    {details.strongTopics.map((t, i) => (
                                      <span key={i}>
                                        <Box
                                          component="span"
                                          sx={{ cursor: "pointer", '&:hover': { textDecoration: 'underline' } }}
                                          onClick={() => { setSelectedTopicData(t); setSelectedTopicStudentName(student.name); }}
                                        >
                                          {t.topic}
                                        </Box>
                                        {i < details.strongTopics.length - 1 ? ", " : ""}
                                      </span>
                                    ))}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">None</Typography>
                                )}
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Weak Topics</Typography>
                                {details.weakTopics?.length ? (
                                  <Typography variant="body2" color="error.main" fontWeight={500}>
                                    {details.weakTopics.map((t, i) => (
                                      <span key={i}>
                                        <Box
                                          component="span"
                                          sx={{ cursor: "pointer", '&:hover': { textDecoration: 'underline' } }}
                                          onClick={() => { setSelectedTopicData(t); setSelectedTopicStudentName(student.name); }}
                                        >
                                          {t.topic}
                                        </Box>
                                        {i < details.weakTopics.length - 1 ? ", " : ""}
                                      </span>
                                    ))}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">None</Typography>
                                )}
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Box>
          ) : (
          <TableContainer sx={{ bgcolor: 'white' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell>Student Details</TableCell>
                  <TableCell align="center">Attendance</TableCell>
                  {roleMode === "class_teacher" ? (
                    <>
                      <TableCell align="center">Overall Score</TableCell>
                      <TableCell>Strong Subjects</TableCell>
                      <TableCell>Weak Subjects</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="center">Subject Score</TableCell>
                      <TableCell>Strong Topics</TableCell>
                      <TableCell>Weak Topics</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Alert severity="info" sx={{ display: "inline-flex" }}>No students available for the selected teacher scope.</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleStudents.map((student) => {
                    const details = getStudentDetailSections({ roleMode, studentReport: student });
                    
                    return (
                      <TableRow key={student.studentId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography fontWeight={700}>{student.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.username} • Class {student.className} • Section {student.sectionName}
                            </Typography>
                            {student.badge ? (
                              <Chip size="small" label={student.badge} color={badgeColorMap[student.badge] || "default"} sx={{ width: "fit-content", fontWeight: 600, mt: 0.5 }} />
                            ) : null}
                          </Stack>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip 
                            label={`${student.attendancePct}%`} 
                            color={student.attendancePct < 75 ? "warning" : "success"} 
                            variant={student.attendancePct < 75 ? "filled" : "outlined"} 
                            size="small" 
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>

                        {roleMode === "class_teacher" ? (
                          <>
                            <TableCell align="center">
                              <Chip 
                                label={`${student.overallAverage}%`} 
                                color={student.overallAverage >= 75 ? "success" : student.overallAverage < 40 ? "error" : "primary"} 
                                size="small" 
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              {student.strongSubjects?.length ? (
                                <Typography variant="body2" color="success.main" fontWeight={500}>
                                  {student.strongSubjects.map(s => s.subject).join(", ")}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">None</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.weakSubjects?.length ? (
                                <Typography variant="body2" color="error.main" fontWeight={500}>
                                  {student.weakSubjects.map(s => s.subject).join(", ")}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">None</Typography>
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell align="center">
                              <Chip 
                                label={`${student.subjectSummary?.marks ?? 0}%`} 
                                color={student.belowThreshold ? "error" : "primary"} 
                                size="small" 
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              {details.strongTopics?.length ? (
                                <Typography variant="body2" color="success.main" fontWeight={500}>
                                  {details.strongTopics.map((t, i) => (
                                    <span key={i}>
                                      <Box
                                        component="span"
                                        sx={{ cursor: "pointer", '&:hover': { textDecoration: 'underline' } }}
                                        onClick={() => { setSelectedTopicData(t); setSelectedTopicStudentName(student.name); }}
                                      >
                                        {t.topic}
                                      </Box>
                                      {i < details.strongTopics.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">None</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {details.weakTopics?.length ? (
                                <Typography variant="body2" color="error.main" fontWeight={500}>
                                  {details.weakTopics.map((t, i) => (
                                    <span key={i}>
                                      <Box
                                        component="span"
                                        sx={{ cursor: "pointer", '&:hover': { textDecoration: 'underline' } }}
                                        onClick={() => { setSelectedTopicData(t); setSelectedTopicStudentName(student.name); }}
                                      >
                                        {t.topic}
                                      </Box>
                                      {i < details.weakTopics.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">None</Typography>
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          )}
        </Paper>
      </Stack>
      
      <TopicDetailDialog
        open={Boolean(selectedTopicData)}
        onClose={() => setSelectedTopicData(null)}
        topicData={selectedTopicData}
        studentName={selectedTopicStudentName}
      />
    </Container>
  );
}
