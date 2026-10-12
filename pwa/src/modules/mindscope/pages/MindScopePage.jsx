import { useState } from "react";
import { Box, Container, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Map, Psychology, Spellcheck, Translate } from "@mui/icons-material";
import GrammarPanel from "../components/GrammarPanel";
import MapsPanel from "../components/MapsPanel";
import MeaningPanel from "../components/MeaningPanel";

const tabs = [
  { value: "grammar", label: "Grammar", icon: <Spellcheck /> },
  { value: "maps", label: "Maps", icon: <Map /> },
  { value: "meaning", label: "Meaning", icon: <Translate /> },
];

export default function MindScopePage() {
  const [activeTab, setActiveTab] = useState("grammar");

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: { xs: 1.5, sm: 3 },
        px: { xs: 1.25, sm: 3 },
        pb: { xs: 9, sm: 10 },
      }}
    >
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 4,
            border: "1px solid rgba(21, 101, 192, 0.12)",
            bgcolor: "background.paper",
            background:
              "linear-gradient(135deg, rgba(255,153,51,0.12) 0%, rgba(255,255,255,1) 38%, rgba(19,136,8,0.08) 100%)",
            boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                flexShrink: 0,
              }}
            >
              <Psychology />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900}>
                MindScope
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
                Grammar, maps, and bilingual word meanings in one place with a cleaner India-inspired study layout.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: 3, sm: 4 },
            border: { xs: "1px solid rgba(226, 232, 240, 0.9)", sm: "1px solid rgba(21, 101, 192, 0.12)" },
            overflow: "hidden",
            boxShadow: { xs: "none", sm: "0 18px 42px rgba(15, 23, 42, 0.08)" },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              px: { xs: 1, sm: 2 },
              pt: 1,
              borderBottom: "1px solid",
              borderColor: { xs: "#e2e8f0", sm: "divider" },
              bgcolor: { xs: "#ffffff", sm: "transparent" },
              "& .MuiTab-root": {
                minHeight: { xs: 58, sm: 72 },
                minWidth: { xs: 108, sm: 140 },
                fontWeight: 800,
                textTransform: "none",
                color: "#31456a",
              },
              "& .Mui-selected": {
                color: "#4f46e5",
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} icon={tab.icon} iconPosition="start" label={tab.label} />
            ))}
          </Tabs>
          <Box
            sx={{
              p: { xs: 1.25, sm: 2.5 },
              bgcolor: { xs: "#ffffff", sm: "#fcfdff" },
            }}
          >
            {activeTab === "grammar" ? <GrammarPanel /> : null}
            {activeTab === "maps" ? <MapsPanel /> : null}
            {activeTab === "meaning" ? <MeaningPanel /> : null}
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
}
