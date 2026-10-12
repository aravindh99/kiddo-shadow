import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  Stack
} from "@mui/material";
import { Send, Close } from "@mui/icons-material";
import { useAuth } from "../../auth/AuthProvider";

export default function GroupChatRoom({ messages, onSend, meta, onClose }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f7fa',
        overflow: 'hidden',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'white',
        }}
      >
        <Box>
          <Typography fontWeight={700}>
            {meta?.subject?.name || "Group Chat"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Class {meta?.class?.class_name || "–"} ({meta?.section?.name || "–"})
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user.id;
            const initial = msg.sender_name
              ? msg.sender_name[0]?.toUpperCase()
              : isMe
              ? "T"
              : "S";
            return (
              <Box
                key={idx}
                sx={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  gap: 1,
                  flexDirection: isMe ? 'row-reverse' : 'row'
                }}
              >
                {!isMe && (
                  <Avatar
                    sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.light' }}
                  >
                    {initial || "?"}
                  </Avatar>
                )}

                <Box>
                  {!isMe && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {msg.sender_name}
                    </Typography>
                  )}
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: isMe ? 'primary.main' : 'white',
                      color: isMe ? 'white' : 'text.primary',
                      borderTopRightRadius: isMe ? 4 : 20,
                      borderTopLeftRadius: isMe ? 20 : 4
                    }}
                  >
                    <Typography variant="body2">{msg.content}</Typography>
                  </Paper>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: isMe ? 'right' : 'left', mt: 0.5, px: 1 }}>
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ""}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <div ref={endRef} />
        </Stack>
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            size="small"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 4 }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!text.trim()}
            sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}
          >
            <Send />
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
}
