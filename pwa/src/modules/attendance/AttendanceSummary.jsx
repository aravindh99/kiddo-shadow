import { Paper, Stack, Typography, Box, Grid, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function AttendanceSummary({ summary }) {
  const theme = useTheme();
  const percent = summary.percentage || 0;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 4,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: "white",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" fontWeight="bold">Performance</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Days: {summary.total_days}</Typography>
        </Box>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            sx={{ color: 'rgba(255,255,255,0.3)' }}
            size={60}
          />
          <CircularProgress
            variant="determinate"
            value={percent}
            sx={{ color: 'white', position: 'absolute', left: 0 }}
            size={60}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" component="div" color="inherit" fontWeight="bold">
              {`${Math.round(percent)}%`}
            </Typography>
          </Box>
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold">{summary.present}</Typography>
            <Typography variant="caption">Present</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold">{summary.absent}</Typography>
            <Typography variant="caption">Absent</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold">{summary.leave}</Typography>
            <Typography variant="caption">Leave</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="bold">{summary.on_duty}</Typography>
            <Typography variant="caption">On Duty</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
