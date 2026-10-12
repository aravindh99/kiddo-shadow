import { Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { Extension, RocketLaunch } from "@mui/icons-material";
import { getMoreFeaturePlaceholders } from "../services/mindscope.service";

export default function MorePanel() {
  const features = getMoreFeaturePlaceholders();

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={7}>
        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <RocketLaunch color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Future Features
              </Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              MindScope is ready for more tools without changing the current grammar, maps, or analytics sections.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              {features.map((feature) => (
                <Chip key={feature} label={feature} color="primary" variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Extension color="secondary" />
              <Typography variant="h6" fontWeight={800}>
                Plug-in Architecture
              </Typography>
            </Stack>
            <Typography color="text.secondary">
              New tools can be added as independent components and connected through the MindScope service layer with real API data later.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
