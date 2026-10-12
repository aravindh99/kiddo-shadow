import {
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Box,
  Chip,
  IconButton
} from "@mui/material";
import { Circle, Notifications, Article, Assignment, Campaign, School, Payment, Settings, AttachMoney, BeachAccess, CalendarMonth, Description, Grade } from "@mui/icons-material";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";

export default function NotificationItem({
  item,
  onAcknowledge,
  tab
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMine = tab === "sent" || (user && String(item.sender_user_id) === String(user.id));
  
  // Format the date nicely
  const dateVal = item.createdAt || item.created_at;
  const createdAtTime = dateVal
    ? new Date(dateVal).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    : null;

  const senderName =
    item?.sender?.name ||
    (item?.sender_role === "school_admin" ? "School Admin" : item?.sender_role === "teacher" ? "Teacher" : "User");

  const senderAvatar =
    item?.sender_role === "school_admin"
      ? item?.school?.logo_url || ""
      : item?.sender?.avatar_url || "";

  const senderInitial =
    item?.sender_role === "school_admin"
      ? "S"
      : senderName?.[0]?.toUpperCase() || "U";

  const isUnread = !item.is_acknowledged;
  
  // Delivery Status
  let deliveryStatus = "Pending";
  if (item.is_acknowledged) deliveryStatus = "Seen";
  else if (item.id) deliveryStatus = "Delivered";

  const handleNotificationClick = () => {
    // Acknowledge if unread (only for received tab)
    if (!isMine && isUnread && onAcknowledge) {
      onAcknowledge(item.id);
    }

    const title = (item.title || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    
    const basePath =
      user.role === "student"
        ? location.pathname.startsWith("/students")
          ? "/students"
          : "/student"
        : user.role === "teacher"
          ? "/teacher"
          : "/parent";

    if (item.module_reference) {
      // route based on module ref if desired, keeping simple fallback below
    }

    if (title.includes("profile update") || cat === "profile update") {
      navigate(`${basePath}/approvals`);
    } else if (title.includes("exam") || cat === "exam") {
      navigate(`${basePath}/timetable`);
    } else if (title.includes("homework") || cat === "homework") {
      navigate(`${basePath}/diary`);
    } else if (title.includes("report") || cat === "exam") {
      navigate(`${basePath}/report-cards`);
    } else if (cat === "fees") {
      navigate(`${basePath}/fees`);
    } else if (title.includes("quiz") || cat === "exam") {
      navigate(`${basePath}/quiz`);
    } else if (cat === "leave") {
      navigate(`${basePath}/leave`);
    } else {
       // if no specific module, maybe go to dashboard or just expand notification
    }
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case "Critical": return "error";
      case "High": return "warning";
      case "Medium": return "info";
      default: return "default";
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "Attendance": return <CalendarMonth fontSize="small" />;
      case "Homework": return <Assignment fontSize="small" />;
      case "Diary": return <Article fontSize="small" />;
      case "Exam": return <Grade fontSize="small" />;
      case "Fees": return <AttachMoney fontSize="small" />;
      case "Leave": return <BeachAccess fontSize="small" />;
      case "Circular": return <Description fontSize="small" />;
      case "Announcement": return <Campaign fontSize="small" />;
      case "Event": return <CalendarMonth fontSize="small" />;
      case "Profile Update": return <Settings fontSize="small" />;
      default: return <Notifications fontSize="small" />;
    }
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 3,
        border: '1px solid',
        borderColor: (!isMine && isUnread) ? 'primary.light' : '#e2e8f0',
        bgcolor: (!isMine && isUnread) ? '#f8faff' : '#ffffff',
        cursor: "pointer",
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transform: 'translateY(-2px)'
        }
      }}
      onClick={handleNotificationClick}
    >
      <CardContent sx={{ p: '20px !important' }}>
        <Stack spacing={1.5}>
          
          {/* Header Row */}
          <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={senderAvatar}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: (!isMine && isUnread) ? "primary.main" : "grey.400",
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {senderInitial}
                </Avatar>
                {/* Role Badge inside Avatar */}
                <Box sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  bgcolor: '#fff',
                  borderRadius: '50%',
                  p: 0.2
                }}>
                  <Chip 
                    label={item?.sender_role === "school_admin" ? "Admin" : item?.sender_role === "teacher" ? "Staff" : "User"} 
                    size="small" 
                    sx={{ height: 16, fontSize: '0.6rem', fontWeight: 'bold' }} 
                    color="primary"
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" lineHeight={1.2}>
                   {isMine ? "You" : senderName}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {createdAtTime}
                  </Typography>
                  {/* Category Chip */}
                  <Chip 
                    icon={getCategoryIcon(item.category)}
                    label={item.category || "General"}
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem', '.MuiChip-icon': { fontSize: 12 } }}
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>

            {/* Right Side: Unread Dot / Priority */}
            <Stack alignItems="flex-end" spacing={1}>
              {!isMine && isUnread && (
                <Circle sx={{ fontSize: 12, color: 'primary.main' }} />
              )}
              {item.priority_level && item.priority_level !== "Low" && (
                <Chip 
                  label={item.priority_level}
                  size="small"
                  color={getPriorityColor(item.priority_level)}
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                />
              )}
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                      FROM
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#0f172a">
                      {isMine ? "You" : senderName}
                  </Typography>
              </Box>
              <Box sx={{ flex: 1, borderLeft: '1px solid #cbd5e1', pl: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                      TO
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#0f172a">
                      {item.target_role === "all" ? "Everyone" : item.target_role.charAt(0).toUpperCase() + item.target_role.slice(1)} 
                      {item.class_id ? ` (Class ${item.class_id})` : ""}
                  </Typography>
              </Box>
          </Stack>

          {/* Content Row: Title and Message */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="h6" fontWeight={700} color="#0f172a" fontSize="1rem" gutterBottom>
              {item.title}
            </Typography>
            <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
              {item.message}
            </Typography>
          </Box>

          {/* Footer Row: Actions */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ pt: 1, mt: 2, borderTop: '1px solid #f1f5f9' }}
          >
            <Typography variant="caption" sx={{ 
              color: deliveryStatus === "Seen" ? 'success.main' : 'text.secondary', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center',
              gap: 0.5
            }}>
               {deliveryStatus}
            </Typography>
          </Stack>

        </Stack>
      </CardContent>
    </Card>
  );
}
