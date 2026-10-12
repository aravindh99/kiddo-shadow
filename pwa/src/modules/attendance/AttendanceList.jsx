import {
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";

export default function AttendanceList({ details }) {
  return (
    <List>
      {details.map((d) => (
        <ListItem key={d.id ?? `${d.date}-${d.student_id}`}>
          <ListItemText
            primary={
              d.Student?.User?.name
                ? `${d.Student.User.name} • ${d.date}`
                : d.date
            }
            secondary={d.status}
          />
          <Chip
            label={d.status}
            color={
              d.status === "present"
                ? "success"
                : d.status === "leave"
                ? "warning"
                : "error"
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
