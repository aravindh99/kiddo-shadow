import { IconButton, Box } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";

export default function VoiceChatControls({
  listening,
  onMicClick,
}) {
  return (
    <Box sx={{ p: 1, textAlign: "center" }}>
      <IconButton
        color={listening ? "error" : "primary"}
        onClick={onMicClick}
        size="large"
      >
        <MicIcon />
      </IconButton>
    </Box>
  );
}
