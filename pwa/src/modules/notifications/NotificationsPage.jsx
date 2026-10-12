import { useState, useMemo } from "react";
import {
  Container,
  Alert,
  Typography,
  Fab,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Stack,
  Skeleton,
  Tabs,
  Tab
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { useNotifications } from "./useNotifications";
import NotificationsList from "./NotificationsList";
import CreateNotificationDialog from "./CreateNotificationDialog";
import { useAuth } from "../../auth/AuthProvider";
import ParentChildSwitcher from "../parents/ParentChildSwitcher";
import { useParentChild } from "../parents/ParentChildContext";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { selectedChild } = useParentChild();

  const [currentTab, setCurrentTab] = useState(0);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const activeTabName = currentTab === 0 ? "received" : "sent";

  const queryParams = useMemo(() => {
    const params = { tab: activeTabName };
    if (user?.role === "parent" && selectedChild?.id) {
      params.student_id = selectedChild.id;
    }
    if (dateFilter !== "all") params.date_filter = dateFilter;
    if (statusFilter !== "all") params.status = statusFilter;
    if (categoryFilter !== "all") params.category = categoryFilter;
    return params;
  }, [activeTabName, user, selectedChild, dateFilter, statusFilter, categoryFilter]);

  const { items, loading, error, refresh, acknowledge } = useNotifications(queryParams);

  const canCreate = user?.role === "teacher" || user?.role === "school_admin";

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const filteredItems = useMemo(() => {
    if (!search || !items) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(lower)) ||
        (item.message && item.message.toLowerCase().includes(lower))
    );
  }, [items, search]);

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 }, pb: 10, px: { xs: 1, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            Notifications
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
            View and manage all your updates.
            </Typography>
        </Box>
      </Box>

      {user?.role === "parent" ? (
        <Box sx={{ mb: 3 }}>
           <ParentChildSwitcher label="Student" />
        </Box>
      ) : null}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label="Received" sx={{ fontWeight: 600, fontSize: '1.05rem' }} />
          {canCreate && <Tab label="Sent" sx={{ fontWeight: 600, fontSize: '1.05rem' }} />}
        </Tabs>
      </Box>

      {/* FILTERS */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          placeholder="Search notifications..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, bgcolor: '#fff', borderRadius: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120, bgcolor: '#fff' }}>
          <InputLabel>Date</InputLabel>
          <Select value={dateFilter} label="Date" onChange={(e) => setDateFilter(e.target.value)}>
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            <MenuItem value="last_7_days">Last 7 Days</MenuItem>
            <MenuItem value="last_30_days">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120, bgcolor: '#fff' }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="unread">Unread</MenuItem>
            <MenuItem value="read">Read</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150, bgcolor: '#fff' }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="all">All Categories</MenuItem>
            {["Attendance", "Homework", "Diary", "Exam", "Fees", "Leave", "Circular", "Announcement", "Event", "Profile Update", "General", "System"].map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Stack spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : filteredItems?.length > 0 ? (
        <NotificationsList items={filteredItems} onAcknowledge={acknowledge} tab={activeTabName} />
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8, p: 4, bgcolor: '#f8fafc', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
          <Typography variant="h6" color="text.secondary" fontWeight={600} gutterBottom>
            No notifications found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You're all caught up!
          </Typography>
        </Box>
      )}

      {canCreate && (
        <>
          <Box sx={{ position: 'fixed', bottom: 80, right: { xs: 16, md: 32 }, zIndex: 1000 }}>
            <Fab color="primary" onClick={() => setShowCreate(true)} sx={{ boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }}>
              <Add />
            </Fab>
          </Box>

          <CreateNotificationDialog
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onSuccess={() => {
              if (refresh) refresh();
            }}
          />
        </>
      )}
    </Container>
  );
}
