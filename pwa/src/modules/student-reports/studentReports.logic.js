const DEFAULT_CLASS_SUBJECTS = [
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Computer Science",
];

const hashString = (value = "") =>
  String(value)
    .split("")
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const titleCase = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStudentDisplayName = (student) =>
  student?.User?.name || student?.user?.name || student?.name || student?.User?.username || student?.user?.username || `Student ${student?.id || ""}`.trim();

const getStudentUsername = (student) =>
  student?.User?.username || student?.user?.username || student?.username || student?.admission_no || `STU-${student?.id || "NA"}`;

const getClassName = (assignment) =>
  assignment?.Class?.class_name || assignment?.class?.class_name || assignment?.class_name || assignment?.class_id || "Class";

const getSectionName = (assignment) =>
  assignment?.Section?.name || assignment?.section?.name || assignment?.section_name || assignment?.section_id || "Section";

const getSubjectName = (assignment) =>
  assignment?.Subject?.name || assignment?.subject?.name || assignment?.subject_name || "Subject";

export const normalizeAssignments = (assignments = []) =>
  (Array.isArray(assignments) ? assignments : []).map((assignment) => ({
    ...assignment,
    classId: Number(assignment?.class_id || assignment?.Class?.id || assignment?.class?.id || 0),
    className: titleCase(getClassName(assignment)),
    sectionId: Number(assignment?.section_id || assignment?.Section?.id || assignment?.section?.id || 0),
    sectionName: titleCase(getSectionName(assignment)),
    subjectId: Number(assignment?.subject_id || assignment?.Subject?.id || assignment?.subject?.id || 0),
    subjectName: titleCase(getSubjectName(assignment)),
    isClassTeacher: Boolean(assignment?.is_class_teacher),
  }));

export const buildClassTeacherScopes = (assignments = []) =>
  normalizeAssignments(assignments)
    .filter((assignment) => assignment.isClassTeacher)
    .map((assignment) => ({
      key: `class-${assignment.classId}-${assignment.sectionId}`,
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      className: assignment.className,
      sectionName: assignment.sectionName,
      label: `Class ${assignment.className} - ${assignment.sectionName}`,
      assignment,
    }));

export const buildSubjectTeacherScopes = (assignments = []) =>
  normalizeAssignments(assignments)
    .filter((assignment) => assignment.subjectId)
    .map((assignment) => ({
    key: `subject-${assignment.subjectId}-${assignment.classId}-${assignment.sectionId}`,
    classId: assignment.classId,
    sectionId: assignment.sectionId,
    subjectId: assignment.subjectId,
    className: assignment.className,
    sectionName: assignment.sectionName,
    subjectName: assignment.subjectName,
    label: `${assignment.subjectName} • ${assignment.className}-${assignment.sectionName}`,
    assignment,
  }));

export const buildAttendanceMap = (items = []) => {
  const aggregate = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const studentId = Number(item?.student_id || item?.Student?.id || item?.student?.id || 0);
    if (!studentId) return;

    const current = aggregate.get(studentId) || { total: 0, present: 0 };
    current.total += 1;
    const status = String(item?.status || "").toLowerCase();
    if (status === "present" || status === "on_duty") current.present += 1;
    aggregate.set(studentId, current);
  });

  return new Map(
    [...aggregate.entries()].map(([studentId, value]) => [
      studentId,
      value.total ? Math.round((value.present / value.total) * 100) : 0,
    ])
  );
};

const buildSubjectSummary = (student, subjectName) => {
  return {
    subject: subjectName,
    marks: 0,
    status: "average",
    weakTopics: [],
    strongTopics: [],
    topics: [],
  };
};

const resolveClassSubjects = (scope, assignments = []) => {
  const scopedSubjects = normalizeAssignments(assignments)
    .filter((assignment) => assignment.classId === scope?.classId && assignment.sectionId === scope?.sectionId)
    .map((assignment) => assignment.subjectName)
    .filter(Boolean);

  const merged = [...new Set([...scopedSubjects, ...DEFAULT_CLASS_SUBJECTS])];
  return merged.slice(0, 6);
};

const fallbackAttendance = (student) => {
  const seed = Math.abs(hashString(`attendance-${student?.id || 0}`));
  return clamp(62 + (seed % 35), 62, 96);
};

export const buildStudentAnalytics = ({ students = [], assignments = [], attendanceMap = new Map() }) => {
  const normalizedAssignments = normalizeAssignments(assignments);

  return (Array.isArray(students) ? students : []).map((student) => {
    const scopedAssignments = normalizedAssignments.filter(
      (assignment) => assignment.classId === Number(student?.class_id || student?.Class?.id || student?.class?.id || 0)
        && assignment.sectionId === Number(student?.section_id || student?.Section?.id || student?.section?.id || 0)
    );

    const subjectNames = [...new Set(scopedAssignments.map((assignment) => assignment.subjectName).filter(Boolean))];
    const classSubjects = subjectNames.length ? subjectNames : DEFAULT_CLASS_SUBJECTS;
    const subjectSummaries = classSubjects.map((subjectName) => buildSubjectSummary(student, subjectName));
    const overallAverage = subjectSummaries.length
      ? Math.round(subjectSummaries.reduce((sum, item) => sum + item.marks, 0) / subjectSummaries.length)
      : 0;
    const attendancePct = attendanceMap.get(Number(student?.id || 0)) ?? fallbackAttendance(student);
    const weakSubjects = subjectSummaries.filter((item) => item.marks < 40);
    const strongSubjects = subjectSummaries.filter((item) => item.marks > 75);
    const weakTopics = subjectSummaries.flatMap((item) =>
      item.weakTopics.map((topic) => ({ ...topic, subject: item.subject }))
    );

    return {
      studentId: Number(student?.id || 0),
      name: getStudentDisplayName(student),
      username: getStudentUsername(student),
      className: titleCase(student?.Class?.class_name || student?.class?.class_name || student?.class_name || ""),
      sectionName: titleCase(student?.Section?.name || student?.section?.name || student?.section_name || ""),
      overallAverage,
      attendancePct,
      subjectSummaries,
      weakSubjects,
      strongSubjects,
      weakTopics,
      badge: overallAverage >= 85 ? "Top Performer" : overallAverage < 40 || attendancePct < 75 ? "Needs Improvement" : null,
      source: "fallback",
    };
  });
};

export const filterStudentsByTeacher = ({
  roleMode,
  selectedScope,
  students = [],
  analytics = [],
}) => {
  if (!selectedScope) return [];

  const analyticsMap = new Map(analytics.map((item) => [item.studentId, item]));
  const scopedStudents = (Array.isArray(students) ? students : []).filter((student) =>
    Number(student?.class_id || student?.Class?.id || student?.class?.id || 0) === Number(selectedScope.classId)
      && Number(student?.section_id || student?.Section?.id || student?.section?.id || 0) === Number(selectedScope.sectionId)
  );

  return scopedStudents.map((student) => {
    const profile = analyticsMap.get(Number(student?.id || 0));
    if (!profile) return null;

    if (roleMode === "subject_teacher") {
      const subjectSummary = profile.subjectSummaries.find((item) => item.subject === selectedScope.subjectName)
        || buildSubjectSummary(student, selectedScope.subjectName);
      return {
        ...profile,
        subjectSummary,
        weakTopics: subjectSummary.weakTopics,
        strongTopics: subjectSummary.strongTopics,
        belowThreshold: subjectSummary.marks < 40,
      };
    }

    return {
      ...profile,
      lowAttendance: profile.attendancePct < 75,
      classWeakSubjects: profile.weakSubjects,
    };
  }).filter(Boolean);
};

const compareStudentIdentity = (left = {}, right = {}) => {
  const leftName = String(left?.name || "").trim();
  const rightName = String(right?.name || "").trim();
  const nameResult = leftName.localeCompare(rightName, undefined, {
    numeric: true,
    sensitivity: "base",
  });

  if (nameResult !== 0) return nameResult;

  const leftUsername = String(left?.username || "").trim();
  const rightUsername = String(right?.username || "").trim();
  return leftUsername.localeCompare(rightUsername, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

export const sortStudentsForRole = (items = [], roleMode, sortMode = "ascending") => {
  const list = [...(Array.isArray(items) ? items : [])];

  if (roleMode === "subject_teacher") {
    return list.sort(compareStudentIdentity);
  }

  if (sortMode === "descending") {
    return list.sort((a, b) => compareStudentIdentity(b, a));
  }

  return list.sort(compareStudentIdentity);
};

export const getInitialRoleMode = (classTeacherScopes = [], subjectTeacherScopes = []) =>
  classTeacherScopes.length ? "class_teacher" : subjectTeacherScopes.length ? "subject_teacher" : "class_teacher";

export const getInitialScopeKey = ({ roleMode, classTeacherScopes = [], subjectTeacherScopes = [] }) =>
  roleMode === "class_teacher" ? classTeacherScopes[0]?.key || "" : subjectTeacherScopes[0]?.key || "";

export const getScopeByKey = ({ roleMode, scopeKey, classTeacherScopes = [], subjectTeacherScopes = [] }) => {
  const scopes = roleMode === "class_teacher" ? classTeacherScopes : subjectTeacherScopes;
  return scopes.find((scope) => scope.key === scopeKey) || null;
};

export const getStudentDetailSections = ({ roleMode, studentReport }) => {
  if (!studentReport) return null;

  if (roleMode === "subject_teacher") {
    return {
      headlineScore: studentReport.subjectSummary?.marks ?? 0,
      weakTopics: studentReport.subjectSummary?.weakTopics ?? [],
      strongTopics: studentReport.subjectSummary?.strongTopics ?? [],
      subjectSummary: [studentReport.subjectSummary].filter(Boolean),
    };
  }

  return {
    headlineScore: studentReport.overallAverage,
    weakTopics: studentReport.weakTopics,
    strongTopics: studentReport.strongSubjects.flatMap((subject) =>
      subject.strongTopics.map((topic) => ({ ...topic, subject: subject.subject }))
    ),
    subjectSummary: studentReport.subjectSummaries,
  };
};

export const getFallbackHint = (items = []) =>
  items.some((item) => item?.source === "fallback")
    ? "No AI test data available. Currently showing baseline estimates."
    : "";

export const resolveClassTeacherSubjects = resolveClassSubjects;
