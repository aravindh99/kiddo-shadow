import { Paper, Typography } from "@mui/material";

export default function DashboardCard({ title, value, subtitle }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 3,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>

      <Typography variant="h5" fontWeight={600}>
        {value}
      </Typography>

      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}
