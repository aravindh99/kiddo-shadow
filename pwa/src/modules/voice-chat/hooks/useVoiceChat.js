import { useState } from "react";
import { askAi, askAiVoice } from "../api/voiceChat.api";
import { useAudioPlayback } from "./useAudioPlayback";

const AUDIO_CONTENT_TYPES = ["audio/wav", "audio/mpeg"];

export function useVoiceChat({ classLevel }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { play, playing } = useAudioPlayback();

  async function send(text) {
    setMessages((p) => [...p, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await askAi(text, classLevel);
      const aiText = res.data?.answer;

      if (aiText) {
        setMessages((p) => [...p, { role: "ai", text: aiText }]);
      }

      // Optional voice response: backend streams audio for the same prompt
      try {
        const audioRes = await askAiVoice(text, classLevel);
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
          setMessages((p) => {
            const next = [...p];
            const lastAiIndex = next.findLastIndex((message) => message.role === "ai");
            if (lastAiIndex >= 0) {
              next[lastAiIndex] = { ...next[lastAiIndex], text: answerText };
              return next;
            }
            return [...next, { role: "ai", text: answerText }];
          });
          return;
        }

        const shouldPlayAudio =
          audioRes?.data instanceof Blob &&
          audioRes.data.size > 0 &&
          AUDIO_CONTENT_TYPES.some((type) => contentType.includes(type));

        console.log("FRONTEND_VOICE_DECISION", {
          contentType,
          textOnly,
          shouldPlayAudio,
        });

        if (shouldPlayAudio) {
          play(audioRes.data);
        }
      } catch {
        // Ignore TTS failures to keep chat responsive
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    messages,
    send,
    loading,
    speaking: playing,
  };
}
