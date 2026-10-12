import { Alert, Container, Grid, Stack, Typography } from "@mui/material";
import DashboardCard from "./DashboardCard";
import { useParentChild } from "../parents/ParentChildContext";

export default function ParentDashboard({ data }) {
  const { children } = useParentChild();
  const dashboardItems = Array.isArray(data?.data) ? data.data : [];
  const notifications = Array.isArray(data?.notifications?.items) ? data.notifications.items : [];
  const unreadNotifications = notifications.filter((n) => !n.is_acknowledged).length;
  const paymentSummary = data?.paymentSummary?.totals || {};
  const totalHomeworkPending = dashboardItems.reduce(
    (sum, item) => sum + (Array.isArray(item?.homework) ? item.homework.filter((work) => !work?.is_completed).length : 0),
    0
  );
  const totalClassesToday = dashboardItems.reduce(
    (sum, item) => sum + (Array.isArray(item?.timetable) ? item.timetable.length : 0),
    0
  );
  const attendanceEntries = dashboardItems.flatMap((item) =>
    Array.isArray(item?.attendance_last_7_days) ? item.attendance_last_7_days : []
  );
  const presentEntries = attendanceEntries.filter((entry) => {
    const status = String(entry?.status || "").toLowerCase();
    return status === "present";
  }).length;
  const attendancePercent = attendanceEntries.length
    ? Math.round((presentEntries / attendanceEntries.length) * 100)
    : 0;
  const paymentReminder =
    paymentSummary.totalBalance > 0
      ? `Payment reminder: ${paymentSummary.totalBalance} is pending.`
      : null;

  return (
    <Container maxWidth="sm" sx={{ mt: 2 }}>
      <Stack spacing={2}>
        {paymentReminder ? <Alert severity="warning">{paymentReminder}</Alert> : null}

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <DashboardCard
              title="Payments Bill"
              value={paymentSummary.totalDue ?? 0}
              subtitle="Total Due"
            />
          </Grid>

          <Grid item xs={6}>
            <DashboardCard
              title="Diary"
              value={totalHomeworkPending}
              subtitle="Pending Work"
            />
          </Grid>

          <Grid item xs={6}>
            <DashboardCard
              title="Timetable"
              value={totalClassesToday}
              subtitle="Classes Today"
            />
          </Grid>

          <Grid item xs={6}>
            <DashboardCard
              title="Attendance"
              value={`${attendancePercent}%`}
              subtitle="Last 7 Days"
            />
          </Grid>
        </Grid>

        <Stack spacing={0.5}>
          <Typography variant="subtitle2" color="text.secondary">
            Parent Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Balance: {paymentSummary.totalBalance ?? 0} | Paid: {paymentSummary.totalPaid ?? 0} | Unread Notices: {unreadNotifications}
          </Typography>
          {children.length ? (
            <Typography variant="body2" color="text.secondary">
              Linked Students: {children.map((child) => child.name).join(", ")}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Container>
  );
}
