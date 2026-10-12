import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  Mic,
  Menu as MenuIcon,
  ChatBubbleOutline,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ChatInput from "../../ai-chat/components/ChatInput";
import { askAi, askAiVoice } from "../api/voiceChat.api";
import { useAuth } from "../../../auth/AuthProvider";
import { useVoiceChatHistory } from "../hooks/useVoiceChatHistory";
import hiClip from "../../../assets/gif/hi.mp4";
import listeningClip from "../../../assets/gif/listening.mp4";
import teachingClip from "../../../assets/gif/teaching.mp4";
import thinkingClip from "../../../assets/gif/thinking.mp4";

const STATE_LABELS = {
  listening: "Listening...",
  thinking: "Thinking...",
  teaching: "Speaking...",
  hi: "Hello!",
};

const DEFAULT_PLAYBACK_RATE = 0.5;
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25];
const AUDIO_CONTENT_TYPES = ["audio/wav", "audio/mpeg"];

const normalizeSubtitle = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return "";

  return raw
    .replace(/^textbook\s+answer\s*:\s*/i, "")
    .replace(/^answer\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default function VoiceChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [robotState, setRobotState] = useState("listening");
  const [subtitle, setSubtitle] = useState("");
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [textOnlyAnswer, setTextOnlyAnswer] = useState("");
  const [error, setError] = useState("");
  const [playbackRate, setPlaybackRate] = useState(DEFAULT_PLAYBACK_RATE);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const speechUtteranceRef = useRef(null);
  const subtitleTrackRef = useRef(null);
  const { messages, conversations, appendMessage, startNewChat, loadConversation } =
    useVoiceChatHistory({
      classLevel: user?.class_level,
      userId: user?.id,
    });

  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 1800);

    return () => {
      clearTimeout(introTimer);
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (robotState !== "listening" || textOnlyMode) return;
    subtitleTrackRef.current = null;
    setSubtitle("");
  }, [robotState, textOnlyMode]);

  const buildSubtitleTrack = (text) => {
    const sentences = String(text || "")
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!sentences.length) return null;

    const totalChars = sentences.reduce((acc, s) => acc + s.length, 0) || 1;
    const cumulative = [];
    let sum = 0;
    for (const s of sentences) {
      sum += s.length;
      cumulative.push(sum);
    }
    return { sentences, cumulative, totalChars };
  };

  const stopCurrentPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speechUtteranceRef.current = null;

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const syncSubtitleWithAudio = (audio) => {
    const track = subtitleTrackRef.current;
    if (!track || !Number.isFinite(audio?.duration) || audio.duration <= 0) return;

    const progress = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
    const targetChars = progress * track.totalChars;
    let idx = track.cumulative.findIndex((count) => targetChars <= count);
    if (idx < 0) idx = track.sentences.length - 1;
    const next = track.sentences[idx] || "";
    setSubtitle((prev) => (prev === next ? prev : next));
  };

  const playAudioBuffer = async (audioData, subtitleText = "") => {
    if (!audioData) return;

    stopCurrentPlayback();

    const blob = audioData instanceof Blob
      ? new Blob([audioData], { type: audioData.type || "audio/wav" })
      : new Blob([audioData], { type: "audio/wav" });

    if (!blob.size) {
      throw new Error("Voice audio response was empty");
    }

    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.preload = "auto";
    audio.playbackRate = playbackRate;
    subtitleTrackRef.current = buildSubtitleTrack(subtitleText);
    setSubtitle(subtitleTrackRef.current?.sentences?.[0] || "");

    const readinessPromise = new Promise((resolve, reject) => {
      const handleReady = () => {
        audio.removeEventListener("canplaythrough", handleReady);
        audio.removeEventListener("error", handlePrepareError);
        resolve();
      };
      const handlePrepareError = () => {
        audio.removeEventListener("canplaythrough", handleReady);
        audio.removeEventListener("error", handlePrepareError);
        reject(new Error("Audio playback could not be prepared"));
      };

      audio.addEventListener("canplaythrough", handleReady, { once: true });
      audio.addEventListener("error", handlePrepareError, { once: true });
    });

    audio.onplay = () => {
      setRobotState("teaching");
      syncSubtitleWithAudio(audio);
    };
    audio.ontimeupdate = () => {
      syncSubtitleWithAudio(audio);
    };
    audio.onended = () => {
      setSubtitle("");
      setRobotState("listening");
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
    audio.onerror = () => {
      setSubtitle("");
      setRobotState("listening");
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };

    audio.load();
    await readinessPromise;
    await audio.play();
  };

  const playBrowserSpeech = async (text) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    const cleanedText = normalizeSubtitle(text);
    if (!synth || typeof SpeechSynthesisUtterance === "undefined" || !cleanedText) {
      throw new Error("Browser speech is not supported");
    }

    stopCurrentPlayback();

    await new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      speechUtteranceRef.current = utterance;
      utterance.rate = playbackRate;
      subtitleTrackRef.current = buildSubtitleTrack(cleanedText);
      setSubtitle(subtitleTrackRef.current?.sentences?.[0] || cleanedText);

      utterance.onstart = () => {
        setRobotState("teaching");
      };
      utterance.onend = () => {
        speechUtteranceRef.current = null;
        setSubtitle("");
        setRobotState("listening");
        resolve();
      };
      utterance.onerror = () => {
        speechUtteranceRef.current = null;
        setSubtitle("");
        setRobotState("listening");
        reject(new Error("Browser speech playback failed"));
      };

      synth.cancel();
      synth.speak(utterance);
    });
  };

  const handleTogglePlaybackRate = () => {
    setPlaybackRate((current) => {
      const currentIndex = PLAYBACK_RATES.indexOf(current);
      const nextIndex =
        currentIndex === -1 || currentIndex === PLAYBACK_RATES.length - 1
          ? 0
          : currentIndex + 1;
      return PLAYBACK_RATES[nextIndex];
    });
  };

  const handleVoiceQuery = async (text) => {
    if (!text || loading) return;
    setShowIntro(false);
    stopCurrentPlayback();
    subtitleTrackRef.current = null;
    setTextOnlyMode(false);
    setTextOnlyAnswer("");
    setLoading(true);
    setError("");
    setSubtitle("");
    setRobotState("thinking");
    appendMessage({
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    });

    try {
      try {
        const audioRes = await askAiVoice(text, user?.class_level);
        const contentType = audioRes?.contentType || audioRes?.data?.type || "";
        const result = audioRes?.result || {};
        const textOnly =
          audioRes?.textOnly === true ||
          result?.textOnly === true ||
          contentType.includes("application/json") ||
          audioRes?.data?.textOnly === true;
        const answerText = String(result?.answer || "").trim();

        if (textOnly || contentType.includes("application/json")) {
          const shouldPlayAudio = false;
          console.log("FRONTEND_VOICE_DECISION", {
            contentType,
            textOnly,
            shouldPlayAudio,
          });
          stopCurrentPlayback();
          subtitleTrackRef.current = null;
          setSubtitle("");
          setTextOnlyAnswer("");
          appendMessage({
            role: "ai",
            text: answerText,
            timestamp: new Date().toISOString(),
          });
          setTextOnlyMode(true);
          setTextOnlyAnswer(answerText);
          setRobotState("listening");
          return;
        }

        const subtitleText = normalizeSubtitle(audioRes?.subtitle || answerText);
        const hasAudioBlob = audioRes?.data instanceof Blob && audioRes.data.size > 0;
        const shouldPlayAudio =
          hasAudioBlob && AUDIO_CONTENT_TYPES.some((type) => contentType.includes(type));

        console.log("FRONTEND_VOICE_DECISION", {
          contentType,
          textOnly,
          shouldPlayAudio,
        });

        appendMessage({
          role: "ai",
          text: subtitleText || "Voice response is ready.",
          timestamp: new Date().toISOString(),
        });

        if (!shouldPlayAudio) {
          throw new Error("Voice response did not include playable audio");
        }

        try {
          await playAudioBuffer(audioRes?.data, subtitleText);
        } catch (playbackErr) {
          console.error("Voice audio playback failed, using subtitle speech fallback:", playbackErr);
          if (subtitleText) {
            await playBrowserSpeech(subtitleText);
          } else {
            throw playbackErr;
          }
        }
      } catch (voiceErr) {
        console.error("Voice audio failed, using browser speech fallback:", voiceErr);
        const textRes = await askAi(text, user?.class_level);
        const answerText = normalizeSubtitle(
          textRes?.data?.answer || textRes?.data?.message || ""
        );

        if (!answerText) {
          throw voiceErr;
        }

        appendMessage({
          role: "ai",
          text: answerText,
          timestamp: new Date().toISOString(),
        });
        await playBrowserSpeech(answerText);
      }
    } catch (err) {
      console.error("Voice chat failed:", err);
      const message = String(err?.message || "");
      const fallbackText = message.toLowerCase().includes("timed out")
        ? "Voice response is taking too long. Please try again."
        : "Voice response is unavailable right now.";
      setError(fallbackText);
      setRobotState("listening");
    } finally {
      setLoading(false);
    }
  };

  const gifState = showIntro ? "hi" : robotState;
  const robotDisplayText = textOnlyMode
    ? textOnlyAnswer
    : robotState === "teaching"
      ? subtitle
      : "";

  const gifSrcMap = {
    hi: hiClip,
    listening: listeningClip,
    thinking: thinkingClip,
    teaching: teachingClip,
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        bgcolor: "#ffffff",
      }}
    >
      <IconButton
        onClick={() => setIsHistoryOpen(true)}
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          bgcolor: "rgba(255,255,255,0.9)",
          boxShadow: 2,
          zIndex: 10,
          backdropFilter: "blur(4px)",
          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
        }}
        aria-label="open voice chat history"
      >
        <MenuIcon />
      </IconButton>

      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          bgcolor: "rgba(255,255,255,0.9)",
          boxShadow: 2,
          zIndex: 10,
          backdropFilter: "blur(4px)",
          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
        }}
      >
        <ArrowBack />
      </IconButton>

      <Drawer
        anchor="left"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        PaperProps={{
          sx: { width: 280, display: "flex", flexDirection: "column" },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ChatBubbleOutline color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Chat History
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => {
              startNewChat();
              setSubtitle("");
              setTextOnlyMode(false);
              setTextOnlyAnswer("");
              setError("");
              setShowIntro(false);
              setRobotState("listening");
              setIsHistoryOpen(false);
            }}
          >
            New
          </Button>
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", opacity: 0.6 }}>
              <Typography variant="body2">No previous voice chats yet.</Typography>
            </Box>
          ) : (
            conversations.map((conversation) => (
              <ListItem key={conversation.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    loadConversation(conversation.id);
                    setSubtitle("");
                    setTextOnlyMode(false);
                    setTextOnlyAnswer("");
                    setError("");
                    setShowIntro(false);
                    setRobotState("listening");
                    setIsHistoryOpen(false);
                  }}
                >
                  <ListItemText
                    primary={conversation.title || "New Voice Chat"}
                    secondary={`${conversation.messages?.length || 0} messages`}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pt: 7,
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 480,
            flexShrink: 0,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            bgcolor: "#ffffff",
            border: 0,
            outline: "none",
            boxShadow: "none",
            overflow: "hidden",
          }}
        >
          <Box
            component="video"
            key={gifSrcMap[gifState]}
            src={gifSrcMap[gifState]}
            autoPlay
            loop
            muted
            playsInline
            sx={{
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
              objectPosition: "center center",
              display: "block",
              bgcolor: "#ffffff",
              border: 0,
              outline: "none",
              boxShadow: "none",
              clipPath: "inset(2px)",
            }}
          />
        </Box>
      </Box>

      <Box sx={{ textAlign: "center", pb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color:
              gifState === "thinking"
                ? "warning.main"
                : gifState === "teaching"
                  ? "success.main"
                  : "primary.main",
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            fontSize: "0.7rem",
          }}
        >
          {STATE_LABELS[gifState] ?? ""}
        </Typography>
        {gifState === "teaching" ? (
          <Button
            size="small"
            variant="outlined"
            onClick={handleTogglePlaybackRate}
            sx={{
              mt: 1,
              minWidth: 0,
              px: 1.5,
              py: 0.35,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {playbackRate}x
          </Button>
        ) : null}
        {robotDisplayText ? (
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              px: 2,
              color: "text.primary",
              fontWeight: 500,
              lineHeight: 1.5,
              maxWidth: 560,
              mx: "auto",
            }}
          >
            {robotDisplayText}
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          px: 2,
          pb: "calc(12px + env(safe-area-inset-bottom))",
          pt: 1,
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <ChatInput
          onSend={(text) => handleVoiceQuery(text)}
          disabled={loading}
          placeholder={error ? error : "Ask anything..."}
          placeholderEndAdornment={<Mic fontSize="small" />}
          placeholderEndAriaLabel="Voice input"
        />
      </Box>
    </Box>
  );
}
