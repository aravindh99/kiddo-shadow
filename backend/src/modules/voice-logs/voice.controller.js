import {
  processVoiceChat,
  getUserVoiceLogs,
} from "./voice.service.js";

export const voiceChat = async (req, res) => {
  try {
    const { question, purpose } = req.body;
    const userId = req.user?.id ?? null;

    const result = await processVoiceChat({
      question,
      purpose,
      userId,
    });

    // Expose subtitle text for frontend voice-chat UI.
    res.set("x-subtitle-text", encodeURIComponent(result.answer || ""));
    res.set("Access-Control-Expose-Headers", "x-subtitle-text");

    if (result.notFoundInBook === true) {
      return res.status(200).json({
        textOnly: true,
        answer: result.answer,
      });
    }

    if (result.textOnly === true || !result.audioBuffer) {
      return res.json({
        answer: result.answer,
        textOnly: true,
        audioUrl: null,
      });
    }

    res.set("Content-Type", "audio/wav");
    return res.send(result.audioBuffer);

  } catch (error) {
    console.error("Voice Chat Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getVoiceLogs = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.json([]);
    }
    const logs = await getUserVoiceLogs(req.user.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
