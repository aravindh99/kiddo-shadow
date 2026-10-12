import { CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useParentChild } from "./ParentChildContext";

export default function ParentChildSwitcher({ label = "Student" }) {
  const { children, selectedChildId, setSelectedChildId, loading } = useParentChild();

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading linked students...
        </Typography>
      </Stack>
    );
  }

  if (children.length <= 1) return null;

  return (
    <TextField
      select
      fullWidth
      label={label}
      value={selectedChildId || ""}
      SelectProps={{ native: true }}
      onChange={(e) => setSelectedChildId(Number(e.target.value))}
    >
      {children.map((child) => (
        <option key={child.id} value={child.id}>
          {child.name}{child.className ? ` - ${child.className}` : ""}{child.sectionName ? ` ${child.sectionName}` : ""}
        </option>
      ))}
    </TextField>
  );
}
