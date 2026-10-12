import { Grid, Card, CardContent, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchTeacherDashboard } from "./dashboard.api";
import TeacherUpcomingClasses from "./TeacherUpcomingClasses";
import { getMyTeacherAssignments } from "../teacher-timetable/teacherTimetable.api";

export default function TeacherDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const [dashboard, assignmentsRes] = await Promise.all([
        fetchTeacherDashboard(),
        getMyTeacherAssignments().catch(() => null),
      ]);

      const assignments =
        assignmentsRes?.data?.data ?? assignmentsRes?.data?.items ?? [];
      const uniqueAssignedClasses = new Set(
        (Array.isArray(assignments) ? assignments : []).map(
          (a) => `${a.class_id}-${a.section_id}`
        )
      ).size;

      const timetableArray = Array.isArray(dashboard?.timetable) ? dashboard.timetable : [];
      const periodsToday = timetableArray.filter(t => !t.is_break).length;
      const classCountFromDashboard = dashboard?.classes?.length ?? 0;

      setData({
        todayClasses: periodsToday,
        pendingHomework: dashboard?.homework_summary?.pending ?? 0,
        pendingReportCards: dashboard?.pending_report_cards ?? 0,
        classes: classCountFromDashboard || uniqueAssignedClasses,
        aiTokens: dashboard?.ai_tokens ?? { remaining: 0, used: 0, total: 0 },
        assignedTests: dashboard?.assigned_tests ?? { total: 0, attempted: 0, pending: 0 },
      });
    } catch {
      setData({
        todayClasses: 0,
        pendingHomework: 0,
        pendingReportCards: 0,
        classes: 0,
        aiTokens: { remaining: 0, used: 0, total: 0 },
        assignedTests: { total: 0, attempted: 0, pending: 0 },
      });
    }
  }

  if (!data) return null;

  return (
    <Grid container spacing={2}>
      <KpiCard title="Today's Classes" value={data.todayClasses} />
      <KpiCard title="My Classes" value={data.classes} />
      <KpiCard title="Homework" value={data.pendingHomework} />
      <KpiCard title="Report Cards" value={data.pendingReportCards} />
      <KpiCard
        title="AI Tokens"
        value={`${data.aiTokens.used}/${data.aiTokens.total}`}
      />
      <KpiCard
        title="Assigned Tests"
        value={`${data.assignedTests.attempted}/${data.assignedTests.total}`}
      />
      <Grid item xs={12}>
        <TeacherUpcomingClasses />
      </Grid>
    </Grid>
  );
}

function KpiCard({ title, value }) {
  return (
    <Grid item xs={6} sm={4} md={2}>
      <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="primary">
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}
