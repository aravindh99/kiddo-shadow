import { useMemo, useState } from "react";
import {
  Container,
  CircularProgress,
  Alert,
  Typography,
  Card,
  CardContent,
  Box,
  Stack,
  Button,
  Fab,
  Grid
} from "@mui/material";
import { Assignment, Add } from "@mui/icons-material";
import { useDiary } from "./useDiary";
import { useAuth } from "../../auth/AuthProvider";
import CreateHomeworkDialog from "./CreateHomeworkDialog";
import DatePickerField from "../../components/DatePickerField";
import { useParentChild } from "../parents/ParentChildContext";
import ParentChildSwitcher from "../parents/ParentChildSwitcher";
import DiaryList from "./DiaryList";
import { deleteHomework } from "./diary.api";

export default function DiaryPage() {
  const { user } = useAuth();
  const { selectedChild } = useParentChild();
  const today = new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate] = useState(today);
  const filters = useMemo(() => {
    const next = filterDate ? { date: filterDate } : {};
    if (user?.role === "parent" && selectedChild?.id) {
      next.student_id = selectedChild.id;
      next.class_id = selectedChild.classId;
      next.section_id = selectedChild.sectionId;
    }
    return next;
  }, [filterDate, selectedChild?.id, selectedChild?.classId, selectedChild?.sectionId, user?.role]);

  const { items, loading, error, refresh } = useDiary(filters);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleEdit = (item) => {
    setEditItem(item);
    setShowCreate(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this homework?")) {
      try {
        await deleteHomework(item.id);
        refresh();
      } catch (err) {
        alert("Failed to delete homework");
      }
    }
  };

  const canCreate = user?.role === "teacher" || user?.role === "school_admin";

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 3, pb: 10 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        My Diary
      </Typography>
      {user?.role === "parent" ? <ParentChildSwitcher label="Student" /> : null}
      {user?.role === "parent" && selectedChild?.name ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Viewing diary for {selectedChild.name}
        </Typography>
      ) : null}

      <Stack spacing={2} sx={{ mb: 2 }}>
        <DatePickerField
          label="Given date"
          value={filterDate}
          onChange={(newVal) => setFilterDate(newVal || today)}
        />
      </Stack>

      {!Array.isArray(items) || items.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 5, color: 'text.secondary' }}>
          <Assignment sx={{ fontSize: 60, opacity: 0.5, mb: 2 }} />
          <Typography>No homework assigned yet!</Typography>
        </Box>
      ) : (() => {
        const filteredItems = items.filter(item => {
          if (!filterDate) return true;
          const hwDate = item.homework_date ? new Date(item.homework_date).toISOString().split("T")[0] : null;
          const dueDate = item.due_date ? new Date(item.due_date).toISOString().split("T")[0] : null;
          const createdAt = (item.created_at || item.createdAt) ? new Date(item.created_at || item.createdAt).toISOString().split("T")[0] : null;
          
          return hwDate === filterDate || dueDate === filterDate || (!hwDate && !dueDate && createdAt === filterDate);
        });

        if (filteredItems.length === 0) {
          return (
            <Box sx={{ textAlign: 'center', mt: 5, color: 'text.secondary' }}>
              <Assignment sx={{ fontSize: 60, opacity: 0.5, mb: 2 }} />
              <Typography>No homework for the selected date!</Typography>
            </Box>
          );
        }

        return Object.entries(
          filteredItems.reduce((acc, item) => {
            const raw =
              item.homework_date ||
              item.due_date ||
              item.created_at ||
              item.createdAt ||
              "unknown";
            const dateKey =
              raw === "unknown"
                ? "unknown"
                : new Date(raw).toISOString().split("T")[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(item);
            return acc;
          }, {})
        ).map(([dateKey, dayItems]) => (
          <Box key={dateKey} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "text.secondary" }}>
                {dateKey === "unknown"
                  ? "No date"
                  : dateKey === today
                    ? "Today's Homework"
                    : new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
              <DiaryList 
                items={dayItems} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                canEdit={canCreate} 
                user={user}
                studentId={user?.role === "student" ? user.student_id : selectedChild?.id}
              />
            </Box>
        ));
      })()}

      {canCreate && (
        <>
          <Box sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}>
            <Fab color="primary" onClick={() => setShowCreate(true)}>
              <Add />
            </Fab>
          </Box>

          <CreateHomeworkDialog
            open={showCreate}
            editItem={editItem}
            onClose={() => {
              setShowCreate(false);
              setEditItem(null);
            }}
            onSuccess={() => {
              if (refresh) refresh();
            }}
          />
        </>
      )}
    </Container>
  );
}
