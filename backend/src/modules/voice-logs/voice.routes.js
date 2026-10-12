import express from "express";
import { voiceChat, getVoiceLogs } from "./voice.controller.js";

const router = express.Router();

router.get("/chat", (req, res) => {
  res.json({ message: "Voice chat endpoint is up. Use POST /api/voice/chat." });
});

router.post("/chat", voiceChat);
router.get("/logs", getVoiceLogs);

export default router;
