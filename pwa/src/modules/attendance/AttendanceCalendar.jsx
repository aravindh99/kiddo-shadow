import { Box, Grid, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import dayjs from "dayjs";

const STATUS_LABEL = {
  present: "P",
  absent: "A",
  leave: "L",
  on_duty: "OD",
};

const STATUS_COLOR = (theme, status) => {
  if (status === "present") return theme.palette.success.main;
  if (status === "absent") return theme.palette.error.main;
  if (status === "leave") return theme.palette.warning.main;
  if (status === "on_duty") return theme.palette.info.main;
  return theme.palette.divider;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AttendanceCalendar({
  details = [],
  month,
  onMonthChange,
  monthsBack = 6,
}) {
  const theme = useTheme();
  const currentMonth = month ? dayjs(month).startOf("month") : dayjs().startOf("month");

  const statusMap = details.reduce((acc, item) => {
    const dateKey = dayjs(item.date || item.created_at).format("YYYY-MM-DD");
    const status = (item.status || "").toLowerCase();
    if (!STATUS_LABEL[status]) return acc;

    const priority = { absent: 4, leave: 3, on_duty: 2, present: 1 };
    const current = acc[dateKey];
    if (!current || priority[status] > priority[current]) {
      acc[dateKey] = status;
    }
    return acc;
  }, {});

  const months = [];
  for (let i = monthsBack; i >= 0; i -= 1) {
    months.push(dayjs().subtract(i, "month").startOf("month"));
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {currentMonth.format("MMMM YYYY")}
          </Typography>
          <Box
            component="select"
            value={currentMonth.format("YYYY-MM")}
            onChange={(e) => {
              const next = months.find((m) => m.format("YYYY-MM") === e.target.value);
              if (next && onMonthChange) onMonthChange(next);
            }}
            style={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 10,
              padding: "6px 10px",
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontSize: 12,
            }}
          >
            {months.map((m) => (
              <option key={m.format("YYYY-MM")} value={m.format("YYYY-MM")}>
                {m.format("MMM YYYY")}
              </option>
            ))}
          </Box>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 0.5,
            mb: 1,
          }}
        >
          {WEEKDAYS.map((d) => (
            <Typography
              key={d}
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 0.5,
          }}
        >
          {(() => {
            const start = currentMonth.startOf("month");
            const end = currentMonth.endOf("month");
            const daysInMonth = end.date();
            const startOffset = (start.day() + 6) % 7;
            const cells = [];
            for (let i = 0; i < startOffset; i += 1) {
              cells.push(null);
            }
            for (let d = 1; d <= daysInMonth; d += 1) {
              cells.push(start.date(d));
            }
            return cells.map((date, idx) => {
              if (!date) {
                return <Box key={`empty-${idx}`} sx={{ height: 52 }} />;
              }
              const dateKey = date.format("YYYY-MM-DD");
              const status = statusMap[dateKey];
              const color = STATUS_COLOR(theme, status);
              return (
                <Box
                  key={dateKey}
                  sx={{
                    height: 52,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: status ? alpha(color, 0.12) : theme.palette.background.default,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {date.date()}
                  </Typography>
                  {status ? (
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color }}>
                      {STATUS_LABEL[status]}
                    </Typography>
                  ) : (
                    <Typography variant="subtitle2" sx={{ color: "transparent" }}>
                      -
                    </Typography>
                  )}
                </Box>
              );
            });
          })()}
        </Box>
      </Box>
    </Stack>
  );
}
