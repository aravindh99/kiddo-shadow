import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Stack
} from "@mui/material";
import { CalendarMonth, Assignment, Article, Grade, AttachMoney, BeachAccess, Description, Campaign, Settings, Notifications, Circle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

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

const getPriorityColor = (level) => {
  switch (level) {
    case "Critical": return "error";
    case "High": return "warning";
    case "Medium": return "info";
    default: return "default";
  }
};

export default function NotificationsList({ items, onAcknowledge, tab }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!items || items.length === 0) return null;

  const handleRowClick = async (item) => {
    if (tab === "received" && !item.is_acknowledged && onAcknowledge) {
      await onAcknowledge(item.id);
    }
    
    const title = (item.title || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    
    const basePath =
      user?.role === "student"
        ? location.pathname.startsWith("/students")
          ? "/students"
          : "/student"
        : user?.role === "teacher"
          ? "/teacher"
          : "/parent";

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
    }
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, mb: 4, overflowX: 'auto' }}>
      <Table sx={{ minWidth: 800 }} aria-label="notifications table">
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            {tab === "received" && <TableCell padding="checkbox"></TableCell>}
            <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date & Time</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Sender / Receiver</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#475569', width: '35%' }}>Message</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const isMine = item.sender_user_id === user?.id;
            const isUnread = tab === "received" && !item.is_acknowledged;
            const date = new Date(item.createdAt || item.created_at);
            
            const senderName = item.sender?.name || "Unknown";
            const targetName = item.target_role === "all" ? "Everyone" : item.target_role.charAt(0).toUpperCase() + item.target_role.slice(1);
            const targetClass = item.class_id ? ` (Class ${item.class_id})` : "";

            let deliveryStatus = "Delivered";
            if (tab === "sent") {
               if (item.acknowledgements && item.acknowledgements.length > 0) deliveryStatus = "Seen";
            } else {
               deliveryStatus = item.is_acknowledged ? "Seen" : "Unread";
            }

            return (
              <TableRow 
                key={item.id} 
                hover 
                onClick={() => handleRowClick(item)}
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: isUnread ? '#f8faff' : 'inherit',
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                {tab === "received" && (
                  <TableCell padding="checkbox">
                    {isUnread && <Circle sx={{ fontSize: 12, color: 'primary.main', ml: 2 }} />}
                  </TableCell>
                )}
                
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="#1e293b">
                    {date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Stack spacing={0.5}>
                     <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ width: 40 }}>From:</Typography>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{isMine ? "You" : senderName}</span>
                     </Typography>
                     <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ width: 40 }}>To:</Typography>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{targetName}{targetClass}</span>
                     </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Chip 
                    icon={getCategoryIcon(item.category)}
                    label={item.category || "General"}
                    size="small"
                    variant="outlined"
                    sx={{ bgcolor: '#fff', mb: 0.5 }}
                  />
                  {item.priority_level && item.priority_level !== "Low" && (
                    <Chip 
                      label={item.priority_level}
                      size="small"
                      color={getPriorityColor(item.priority_level)}
                      sx={{ height: 24, display: 'flex', width: 'fit-content' }}
                    />
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={0.5}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.message}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip 
                    label={deliveryStatus} 
                    size="small" 
                    color={deliveryStatus === "Seen" ? "success" : deliveryStatus === "Unread" ? "primary" : "default"}
                    variant={deliveryStatus === "Seen" ? "outlined" : "filled"}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
