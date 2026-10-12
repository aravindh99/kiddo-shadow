import { Box, useTheme, Zoom, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, Divider, Button, TextField, InputAdornment, Snackbar, Alert } from "@mui/material";
import { Add, Close, SmartToy, VolumeUp, Mic, Menu as MenuIcon, ChatBubbleOutline, Search } from "@mui/icons-material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAiChat } from "../hooks/useAiChat";
import { getRelatedQuestions } from "../api/relatedQuestions.api";
import ChatList from "../components/ChatList";
import ChatInput from "../components/ChatInput";
import MessageBubble from "../components/MessageBubble";
import { useAuth } from "../../../auth/AuthProvider";
import deepListeningClip from "../../../assets/gif/deep-listening.mp4";
import deepThinkingClip from "../../../assets/gif/deep-thinking.mp4";
import friendlyHiClip from "../../../assets/gif/friendly-hi.mp4";
import gentleHiClip from "../../../assets/gif/gentle-hi.mp4";
import hiClip from "../../../assets/gif/hi.mp4";
import listeningClip from "../../../assets/gif/listening.mp4";
import teachingClip from "../../../assets/gif/teaching.mp4";
import thinkingClip from "../../../assets/gif/thinking.mp4";

const QUIZ_REDIRECT_THRESHOLD = 30;
const SUBJECTS = ["Maths", "Physics", "Chemistry", "Other Subjects"];
const GEMINI_SOLVER_SUBJECTS = new Set(["maths", "physics", "chemistry"]);
const SUBJECT_REQUIRED_MESSAGE = "Please select a specific subject.";
const CHAT_INPUT_DOCK_HEIGHT = 138;
const CHAT_INPUT_DOCK_EXPANDED_HEIGHT = 262;
const CHAT_FOOTER_SAFE_GAP = 28;

function normalizeRelatedQuestions(response) {
  const data = response?.data?.data ?? response?.data ?? response;
  const candidates = Array.isArray(data)
    ? data
    : data?.relatedQuestions ?? data?.related_questions ?? data?.questions ?? [];

  return [...new Set(
    (Array.isArray(candidates) ? candidates : [])
      .map((item) => String(item?.question ?? item ?? "").trim())
      .filter(Boolean)
  )].slice(0, 4);
}

function deriveQuizTopic(messages = []) {
  const userMessages = messages
    .filter((message) => message?.role === "user" && typeof message?.text === "string")
    .map((message) => message.text.trim())
    .filter(Boolean);

  if (!userMessages.length) return "General Knowledge";

  const latestDetailedMessage =
    [...userMessages].reverse().find((text) => text.length >= 12) ||
    userMessages[userMessages.length - 1];

  return latestDetailedMessage.length > 80
    ? `${latestDetailedMessage.slice(0, 77).trim()}...`
    : latestDetailedMessage;
}

export default function AiChatPage() {
  const introClips = [
    gentleHiClip,
    friendlyHiClip,
    hiClip,
    listeningClip,
    teachingClip,
    deepThinkingClip,
    deepListeningClip,
    thinkingClip,
  ];
  const { user } = useAuth();
  const theme = useTheme();
  const pageBg = "#ffffff";
  const [showIntro, setShowIntro] = useState(true);
  const [introClipIndex, setIntroClipIndex] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectValidationMessage, setSubjectValidationMessage] = useState("");
  const [pendingRelatedNavigation, setPendingRelatedNavigation] = useState(null);
  const [ragAnswerLoadingByMessageId, setRagAnswerLoadingByMessageId] = useState({});
  const [ragAnswerError, setRagAnswerError] = useState("");
  const messagesScrollRef = useRef(null);
  const previousUserCountRef = useRef(0);
  const imageInputRef = useRef(null);
  const createdImageUrlsRef = useRef([]);
  const relatedRequestIdRef = useRef(0);
  const ragExplanationCacheRef = useRef({ question: "", answers: {} });
  const navigate = useNavigate();
  const location = useLocation();
  const classLevel = user?.class_level ?? "general";
  const openVoiceChat = () => {
    navigate(location.pathname.replace("/ai-chat", "/voice-chat"));
  };

  const {
    messages,
    conversations,
    loading,
    historyLoading,
    historyHasMore,
    historyQuery,
    sendMessage,
    generateRagAnswerForMessage,
    appendRagAnswerForMessage,
    loadConversation,
    startNewChat,
    loadMoreConversations,
    setHistoryQuery,
  } = useAiChat({
    classLevel,
    userId: user?.id,
  });

  const userMessageCount = useMemo(
    () => messages.filter((message) => message?.role === "user").length,
    [messages]
  );
  const chatInputDockHeight =
    selectedImages.length > 0
      ? CHAT_INPUT_DOCK_EXPANDED_HEIGHT
      : CHAT_INPUT_DOCK_HEIGHT;
  const messagesBottomPadding = `calc(${chatInputDockHeight + CHAT_FOOTER_SAFE_GAP}px + env(safe-area-inset-bottom))`;
  const loadingRelatedQuestions = pendingRelatedNavigation?.loading === true;
  const hasPendingRelatedNavigation = Boolean(pendingRelatedNavigation);

  async function handleSendMessage(text) {
    if (showIntro) setShowIntro(false);
    const selectedImage = selectedImages[0] || null;
    const subjectForRequest = selectedSubject;
    ragExplanationCacheRef.current = { question: text, answers: {} };
    try {
      return await sendMessage(text, null, {
        subject: subjectForRequest,
        ...(selectedImage
          ? {
              image: selectedImage.file,
              imagePreviewUrl: selectedImage.previewUrl,
              imageName: selectedImage.name,
            }
          : {}),
      });
    } finally {
      setSelectedSubject(null);
      clearSelectedImages({ revoke: false });
    }
  }

  async function handleQuestionNavigation(text) {
    if (!text || loadingRelatedQuestions) return;
    if (!selectedSubject) {
      setSubjectValidationMessage(SUBJECT_REQUIRED_MESSAGE);
      return;
    }

    const isGeminiSolverRequest = GEMINI_SOLVER_SUBJECTS.has(
      String(selectedSubject || "").trim().toLowerCase()
    );
    if (isGeminiSolverRequest) {
      setPendingRelatedNavigation(null);
      return handleSendMessage(text);
    }

    const requestId = relatedRequestIdRef.current + 1;
    const messageId = `related-nav-${Date.now()}-${requestId}`;
    relatedRequestIdRef.current = requestId;
    setShowIntro(false);
    setPendingRelatedNavigation({
      messageId,
      question: text,
      questions: [],
      loading: true,
      imagePreviewUrl: selectedImages[0]?.previewUrl,
      imageName: selectedImages[0]?.name,
    });

    try {
      const response = await getRelatedQuestions(text);
      if (requestId !== relatedRequestIdRef.current) return;
      const questions = normalizeRelatedQuestions(response);
      if (questions.length !== 4) throw new Error("Related questions response must contain four questions.");
      setPendingRelatedNavigation((current) =>
        current?.messageId === messageId
          ? { ...current, questions, loading: false }
          : current
      );
    } catch {
      if (requestId !== relatedRequestIdRef.current) return;
      setPendingRelatedNavigation(null);
      return handleSendMessage(text);
    }
  }

  async function handleRelatedQuestionSelect(messageId, question) {
    if (!question || loading || pendingRelatedNavigation?.messageId !== messageId) return;
    setPendingRelatedNavigation(null);
    await handleSendMessage(question);
  }

  async function handleNoneOfAbove(messageId) {
    if (loading || pendingRelatedNavigation?.messageId !== messageId) return;
    const originalQuestion = pendingRelatedNavigation.question;
    setPendingRelatedNavigation(null);
    await handleSendMessage(originalQuestion);
  }

  async function handleRagAnswerMode(message, mode) {
    const messageId = message?.id;
    const question = message?.metadata?.originalQuestion;
    const answer = message?.text || message?.content || "";
    if (!messageId || !question || !answer || ragAnswerLoadingByMessageId[messageId]?.[mode]) return;

    if (ragExplanationCacheRef.current.question !== question) {
      ragExplanationCacheRef.current = { question, answers: {} };
    }

    const cachedAnswer = ragExplanationCacheRef.current.answers[mode];
    if (cachedAnswer) {
      appendRagAnswerForMessage({ answerText: cachedAnswer, mode });
      return;
    }

    setRagAnswerError("");
    setRagAnswerLoadingByMessageId((prev) => ({
      ...prev,
      [messageId]: {
        ...(prev[messageId] || {}),
        [mode]: true,
      },
    }));
    try {
      const answerText = await generateRagAnswerForMessage({ question, answer, mode });
      ragExplanationCacheRef.current.answers[mode] = answerText;
    } catch (error) {
      setRagAnswerError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "AI assistant is temporarily unavailable. Please try again."
      );
    } finally {
      setRagAnswerLoadingByMessageId((prev) => {
        const next = { ...prev };
        const messageLoading = { ...(next[messageId] || {}) };
        delete messageLoading[mode];
        if (Object.keys(messageLoading).length) {
          next[messageId] = messageLoading;
        } else {
          delete next[messageId];
        }
        return next;
      });
    }
  }

  function handleImageUpload(event) {
    const file = Array.from(event.target.files || []).find((item) =>
      item.type.startsWith("image/")
    );
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    createdImageUrlsRef.current.push(previewUrl);
    setSelectedImages((prev) => {
      prev.forEach((image) => revokeImagePreview(image.previewUrl));
      return [
        {
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
          previewUrl,
        },
      ];
    });
    event.target.value = "";
  }

  function removeSelectedImage(imageId) {
    setSelectedImages((prev) => {
      const image = prev.find((item) => item.id === imageId);
      if (image?.previewUrl) revokeImagePreview(image.previewUrl);
      return prev.filter((item) => item.id !== imageId);
    });
  }

  function clearSelectedImages({ revoke = true } = {}) {
    setSelectedImages((prev) => {
      if (revoke) {
        prev.forEach((image) => revokeImagePreview(image.previewUrl));
      }
      return [];
    });
  }

  function revokeImagePreview(previewUrl) {
    if (!previewUrl) return;
    URL.revokeObjectURL(previewUrl);
    createdImageUrlsRef.current = createdImageUrlsRef.current.filter((url) => url !== previewUrl);
  }

  useEffect(() => {
    return () => {
      createdImageUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      createdImageUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const scroller = messagesScrollRef.current;
    if (!scroller) return;
    const id = requestAnimationFrame(() => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [messages, loading, pendingRelatedNavigation]);

  useEffect(() => {
    const previousCount = previousUserCountRef.current;
    previousUserCountRef.current = userMessageCount;

    if (userMessageCount < QUIZ_REDIRECT_THRESHOLD || previousCount >= QUIZ_REDIRECT_THRESHOLD) {
      return;
    }

    const quizTopic = deriveQuizTopic(messages);
    const basePath = location.pathname.startsWith("/students") ? "/students" : "/student";

    navigate(`${basePath}/quiz/single`, {
      state: {
        prefilledTopic: quizTopic,
        autoStart: true,
        source: "ai-chat",
      },
    });
  }, [location.pathname, messages, navigate, userMessageCount]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        minHeight: 0,
        bgcolor: pageBg,
        overflow: "hidden",
        position: "relative",
        overscrollBehavior: "none",
      }}
    >
      <IconButton
        onClick={() => setIsHistoryOpen(true)}
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          bgcolor: "rgba(255,255,255,0.85)",
          boxShadow: 1,
          zIndex: 4,
          backdropFilter: "blur(4px)",
          color: "text.primary"
        }}
        aria-label="open chat history"
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        PaperProps={{
          sx: { width: 280, display: 'flex', flexDirection: 'column' }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ChatBubbleOutline color="primary" />
            <Typography variant="h6" fontWeight="bold">Chat History</Typography>
          </Box>
          <Button
            size="small"
            onClick={() => {
              relatedRequestIdRef.current += 1;
              setPendingRelatedNavigation(null);
              startNewChat();
              setIsHistoryOpen(false);
            }}
          >
            New
          </Button>
        </Box>
        <Divider />
        <Box sx={{ p: 1.5 }}>
          <TextField
            value={historyQuery}
            onChange={(event) => setHistoryQuery(event.target.value)}
            placeholder="Search conversations"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
              <Typography variant="body2">No previous chats yet.</Typography>
            </Box>
          ) : (
            conversations.map((conv) => (
              <ListItem key={conv.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    relatedRequestIdRef.current += 1;
                    setPendingRelatedNavigation(null);
                    loadConversation(conv.id);
                    setShowIntro(false);
                    setIsHistoryOpen(false);
                  }}
                >
                  <ListItemText
                    primary={conv.title || "New Chat"}
                    secondary={
                      conv.previewText
                        ? `${conv.previewText.slice(0, 52)}${conv.previewText.length > 52 ? "..." : ""} • ${conv.messageCount ?? conv.messages?.length ?? 0} messages`
                        : `${conv.messageCount ?? conv.messages?.length ?? 0} messages`
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
        {historyHasMore ? (
          <Box sx={{ p: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={loadMoreConversations}
              disabled={historyLoading}
            >
              {historyLoading ? "Loading..." : "Load More"}
            </Button>
          </Box>
        ) : null}
      </Drawer>

      {showIntro && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 1,
            bgcolor: pageBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
  component="video"
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  src={introClips[introClipIndex]}
  onLoadedData={() => {
    console.log("VIDEO LOADED:", introClips[introClipIndex]);
  }}
  onError={(e) => {
    console.error("VIDEO ERROR:", introClips[introClipIndex], e);

    if (introClipIndex !== 2) {
      setIntroClipIndex(2);
    }
  }}
            sx={{
              width: "100%",
              height: "calc(100% - 130px)",
              objectFit: "contain",
              objectPosition: "center center",
              display: "block",
              bgcolor: pageBg,
            }}
          />
        </Box>
      )}

      {!showIntro && (
        <Box
          ref={messagesScrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            scrollBehavior: "smooth",
            display: "flex",
            flexDirection: "column",
            pb: messagesBottomPadding,
          }}
        >
          <ChatList
            messages={messages}
            userAvatar={user?.avatar_url}
            ragAnswerLoadingByMessageId={ragAnswerLoadingByMessageId}
            onRagAnswerMode={handleRagAnswerMode}
          />

          {pendingRelatedNavigation && (
            <Box sx={{ px: 2, minWidth: 0 }}>
              <MessageBubble
                message={{
                  id: pendingRelatedNavigation.messageId,
                  role: "user",
                  text: pendingRelatedNavigation.question,
                  imagePreviewUrl: pendingRelatedNavigation.imagePreviewUrl,
                  imageName: pendingRelatedNavigation.imageName,
                }}
                userAvatar={user?.avatar_url}
              />

              {pendingRelatedNavigation.loading ? (
                <Typography sx={{ ml: { xs: 0, sm: 5.75 }, mb: 2 }} color="text.secondary" variant="body2">
                  Finding related questions…
                </Typography>
              ) : (
                <Box
                  component="nav"
                  aria-label={`Related questions for ${pendingRelatedNavigation.question}`}
                  sx={{ ml: { xs: 0, sm: 5.75 }, mb: 2, display: "flex", flexDirection: "column", gap: 1 }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    Choose a related question
                  </Typography>
                  {pendingRelatedNavigation.questions.map((question) => (
                    <Button
                      key={question}
                      variant="outlined"
                      disabled={loading}
                      onClick={() => handleRelatedQuestionSelect(pendingRelatedNavigation.messageId, question)}
                      sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none" }}
                    >
                      {question}
                    </Button>
                  ))}
                  <Button
                    variant="outlined"
                    disabled={loading}
                    onClick={() => handleNoneOfAbove(pendingRelatedNavigation.messageId)}
                    sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none" }}
                  >
                    None of the above
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {loading && (
            <Box sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SmartToy sx={{ fontSize: 20, color: "white" }} />
              </Box>
              <Zoom in={true}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 2,
                    borderBottomLeftRadius: 0,
                    boxShadow: 1,
                  }}
                >
                  <div className="typing-indicator">
                    <span>●</span><span>●</span><span>●</span>
                  </div>
                </Box>
              </Zoom>
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 8,
          display: "flex",
          justifyContent: "center",
          px: { xs: 1.5, sm: 2 },
          pt: 1.25,
          pb: "calc(12px + env(safe-area-inset-bottom))",
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid rgba(226, 232, 240, 0.9)",
          boxShadow: "0 -10px 30px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Box
          sx={{
            width: "min(calc(100% - 8px), 900px)",
            px: 0,
            pt: 0,
            bgcolor: "transparent",
            minHeight: chatInputDockHeight,
            display: "flex",
            flexDirection: "column",
          }}
        >
        <Box
          role="group"
          aria-label="Select a subject for this question"
          sx={{ display: "flex", gap: 1, mb: 1, px: 1, flexWrap: "wrap" }}
        >
          {SUBJECTS.map((subject) => {
            const isSelected = selectedSubject === subject;
            return (
              <Button
                key={subject}
                size="small"
                variant={isSelected ? "contained" : "outlined"}
                aria-pressed={isSelected}
                disabled={loading || loadingRelatedQuestions}
                onClick={() => {
                  setSelectedSubject(subject);
                  setSubjectValidationMessage("");
                }}
                sx={{ borderRadius: 999, textTransform: "none", minWidth: 88 }}
              >
                {subject}
              </Button>
            );
          })}
        </Box>
        {subjectValidationMessage ? (
          <Typography
            role="alert"
            variant="caption"
            color="error"
            sx={{ display: "block", px: 1, mb: 1 }}
          >
            {subjectValidationMessage}
          </Typography>
        ) : null}
        {selectedImages.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mb: 1,
              overflowX: "auto",
              pb: 0.5,
              px: 1,
            }}
          >
            {selectedImages.map((image) => (
              <Box
                key={image.id}
                sx={{
                  position: "relative",
                  flex: "0 0 auto",
                  width: 58,
                  height: 58,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  border: "1px solid #d8e0ec",
                  bgcolor: "#f8fafc",
                }}
              >
                <Box
                  component="img"
                  src={image.previewUrl}
                  alt={image.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <IconButton
                  size="small"
                  disabled={hasPendingRelatedNavigation}
                  aria-label="Remove image"
                  onClick={() => removeSelectedImage(image.id)}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    p: 0,
                    color: "#ffffff",
                    bgcolor: "rgba(15, 23, 42, 0.72)",
                    "&:hover": {
                      bgcolor: "rgba(15, 23, 42, 0.86)",
                    },
                  }}
                >
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
        <ChatInput
          onSend={handleQuestionNavigation}
          disabled={loading || hasPendingRelatedNavigation}
          placeholder="Type a question..."
          placeholderEndAdornment={<Mic fontSize="small" />}
          placeholderEndAriaLabel="Voice input"
          startAdornment={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />
              <IconButton
                size="small"
                color="primary"
                disabled={loading || hasPendingRelatedNavigation}
                aria-label="Upload image"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  imageInputRef.current?.click();
                }}
                onTouchStart={(event) => {
                  event.stopPropagation();
                }}
              >
                <Add />
              </IconButton>
              <IconButton
                size="small"
                color="primary"
                disabled={loading || hasPendingRelatedNavigation}
                aria-label="Open voice chat"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openVoiceChat();
                }}
                onTouchStart={(event) => {
                  event.stopPropagation();
                }}
              >
                <VolumeUp />
              </IconButton>
            </Box>
          }
        />
        </Box>
      </Box>

      <style>{`
        .typing-indicator span {
          animation: blink 1.4s infinite both;
          font-size: 12px;
          margin: 0 1px;
          color: ${theme.palette.text.secondary};
        }
        .typing-indicator span:nth-of-type(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-of-type(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
      <Snackbar
        open={Boolean(ragAnswerError)}
        autoHideDuration={4000}
        onClose={() => setRagAnswerError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setRagAnswerError("")}>
          {ragAnswerError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
