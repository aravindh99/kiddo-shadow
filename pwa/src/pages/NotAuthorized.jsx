import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotAuthorized() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
      }}
    >
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Access Denied
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        You don’t have permission to view this page.
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate(-1)}
      >
        Go Back
      </Button>
    </Box>
  );
}
