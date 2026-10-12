import { Stack } from "@mui/material";
import DiaryItem from "./DiaryItem";

export default function DiaryList({ items, onEdit, onDelete, canEdit, user, studentId }) {
  return (
    <Stack spacing={2}>
      {items.map((item) => (
        <DiaryItem 
          key={item.id} 
          item={item} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          canEdit={canEdit} 
          user={user}
          studentId={studentId}
        />
      ))}
    </Stack>
  );
}
