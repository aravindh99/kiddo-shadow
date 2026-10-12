import { useState, useRef } from "react";
import { Send } from "@mui/icons-material";
import { Paper, InputBase, IconButton, useTheme, Fade } from "@mui/material";

export default function ChatInput({
  onSend,
  disabled,
  placeholder = "Type a message...",
  onInputFocus,
  startAdornment,
  placeholderEndAdornment,
  onPlaceholderEndClick,
  placeholderEndAriaLabel = "Voice input",
}) {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const theme = useTheme();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      // Focus back on input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = async () => {
    if (disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setVoiceError("Microphone speech input is not supported on this browser.");
      return;
    }

    // Force browser permission prompt on first tap (WhatsApp-like flow).
    // If permission is denied, browser will not show popup again until user resets it.
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setVoiceError("Microphone permission denied. Allow mic access in browser settings.");
          return;
        }
        if (name === "NotFoundError") {
          setVoiceError("No microphone device found.");
          return;
        }
        if (name === "NotReadableError") {
          setVoiceError("Microphone is busy. Close other apps using mic and retry.");
          return;
        }
      }
    }

    setVoiceError("");
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      const error = event?.error;
      if (error === "not-allowed" || error === "service-not-allowed") {
        setVoiceError("Microphone permission denied. Allow mic access in browser settings.");
        return;
      }
      if (error === "no-speech") {
        setVoiceError("No speech detected. Tap mic and speak clearly.");
        return;
      }
      setVoiceError("Microphone input failed. Try again.");
    };
    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) return;
      onSend(transcript);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError("Unable to start microphone. Use HTTPS or localhost and retry.");
    }
  };

  return (
    <>
    <Paper
      elevation={0}
      sx={{
        p: "4px 10px",
        display: 'flex',
        alignItems: 'center',
        width: "100%",
        minHeight: 46,
        borderRadius: "999px",
        overflow: "hidden",
        boxSizing: "border-box",
        bgcolor: "#ffffff",
        border: "1px solid #e5e9f1",
        boxShadow: "0 3px 10px rgba(15, 23, 42, 0.12)",
        transition: 'box-shadow 0.2s ease',
        '&:focus-within': {
          boxShadow: `0 4px 14px ${theme.palette.primary.main}33`,
        }
      }}
    >
      {startAdornment || null}

      <InputBase
        inputRef={inputRef}
        sx={{
          ml: startAdornment ? 1 : 2,
          flex: 1,
          color: theme.palette.text.primary,
          fontSize: { xs: 15, sm: 15 },
          lineHeight: 1.4,
          "& .MuiInputBase-input": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        onFocus={onInputFocus}
        disabled={disabled}
      />

      {!message.trim() && placeholderEndAdornment ? (
        <IconButton
          size="small"
          disabled={disabled}
          aria-label={placeholderEndAriaLabel}
          sx={{
            p: "6px",
            opacity: 0.8,
            color: isListening ? theme.palette.error.main : "inherit",
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (onPlaceholderEndClick) {
              onPlaceholderEndClick(event);
              return;
            }
            void handleVoiceInput();
          }}
          onTouchStart={(event) => {
            event.stopPropagation();
          }}
        >
          {placeholderEndAdornment}
        </IconButton>
      ) : null}

      <Fade in={!!message.trim()}>
        <IconButton
          color="primary"
          size="small"
          sx={{ p: "6px", touchAction: "manipulation" }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleSend();
          }}
          onTouchStart={(event) => {
            event.stopPropagation();
          }}
          disabled={disabled || !message.trim()}
          aria-label="Send message"
        >
          <Send />
        </IconButton>
      </Fade>
    </Paper>
    {voiceError ? (
      <div
        style={{
          color: "#d32f2f",
          fontSize: 12,
          marginTop: 6,
          paddingLeft: startAdornment ? 8 : 12,
        }}
      >
        {voiceError}
      </div>
    ) : null}
    {isListening ? (
      <div
        style={{
          color: "#1976d2",
          fontSize: 12,
          marginTop: 6,
          paddingLeft: startAdornment ? 8 : 12,
        }}
      >
        Listening... tap mic again to stop
      </div>
    ) : null}
    </>
  );
}
