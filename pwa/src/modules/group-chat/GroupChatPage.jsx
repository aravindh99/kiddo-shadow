import {
  Container,
  CircularProgress,
  Alert,
  Typography,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  MenuItem,
  TextField,
  Autocomplete
} from "@mui/material";
import { Add, Chat } from "@mui/icons-material";
import { useState, useMemo } from "react";
import { useGroupChats } from "./useGroupChats";
import GroupChatList from "./GroupChatList";
import { createGroupChat, deleteGroupChat } from "./groupChat.api";
import { useTeacherTimetable } from "../teacher-timetable/useTeacherTimetable";
import { useAuth } from "../../auth/AuthProvider";

export default function GroupChatPage() {
  const { user } = useAuth();
  const { groups, loading, error, refresh } = useGroupChats();
  const { timetable } = useTeacherTimetable();

  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [creating, setCreating] = useState(false);

  // Deduplicate timetable to get unique Subject-Class-Section combinations
  const options = useMemo(() => {
    if (!timetable) return [];

    const slots = Array.isArray(timetable)
      ? timetable
      : Object.values(timetable || {}).flat();

    const uniqueMap = new Map();

    slots.forEach((Entry) => {
      const cls = Entry.class || {};
      const sec = Entry.section || {};
      const subj = Entry.subject || {};

      if (!cls.id || !sec.id || !subj.id) return;

      const className = cls.class_name || cls.name || cls.title || "Class";
      const sectionName = sec.name || sec.title || "Section";

      const key = `${cls.id}-${sec.id}-${subj.id}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          label: `${subj.name || "Subject"} - Class ${className} (${sectionName})`,
          value: key,
          data: {
            subjectId: subj.id,
            sectionId: sec.id,
            classId: cls.id,
            schoolId: Entry.school_id,
          },
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [timetable]);

  const handleCreate = async () => {
    if (!selectedOption) return;

    try {
      setCreating(true);
      await createGroupChat({
        subjectId: selectedOption.data.subjectId,
        sectionId: selectedOption.data.sectionId,
      });
      setOpen(false);
      refresh(); // Reload list
      // Optionally show success toast
    } catch (err) {
      console.error(err);
      alert("Failed to create group chat");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (chatId) => {
    if (!window.confirm("Delete this group chat?")) return;
    try {
      await deleteGroupChat(chatId);
      refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete group chat");
    }
  };

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
    <Container maxWidth="sm" sx={{ mt: 4, pb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Group Chats
        </Typography>
      </Box>

      {groups.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, opacity: 0.7 }}>
          <Chat sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
          <Typography>No group chats active.</Typography>
          {user.role === 'teacher' && (
            <Typography variant="caption">
              Tap + to start a discussion with your class.
            </Typography>
          )}
        </Box>
      ) : (
        <GroupChatList groups={groups} onDelete={user.role === 'teacher' ? handleDelete : undefined} />
      )}

      {/* FAB for Teachers Only */}
      {user.role === 'teacher' && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 80, right: 24 }}
          onClick={() => setOpen(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create Class Group</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a class section and subject from your schedule to create a dedicated group chat.
          </Typography>

          <Autocomplete
            options={options}
            getOptionLabel={(option) => option.label}
            value={selectedOption}
            onChange={(e, val) => setSelectedOption(val)}
            renderInput={(params) => <TextField {...params} label="Select Class" autoFocus />}
            noOptionsText="No classes found in your timetable"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!selectedOption || creating}
          >
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
