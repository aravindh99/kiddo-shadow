import { Avatar, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";

export default function ChatMessage({ role, text, timestamp, userAvatar }) {
  const isUser = role === "user";
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  return (
    <div className={`message-row ${isUser ? "user" : "ai"}`}>
      {/* Avatar */}
      {isUser ? (
        <Avatar src={userAvatar} className="chat-avatar" />
      ) : (
        <Avatar sx={{ bgcolor: '#FFF', color: '#6C63FF', boxShadow: 1 }} className="chat-avatar">
          <SmartToyIcon fontSize="small" />
        </Avatar>
      )}

      {/* Bubble */}
      <div className={`chat-bubble ${isUser ? "user" : "ai"}`}>
        {text}
        {time && <span className="message-time">{time}</span>}
      </div>
    </div>
  );
}
