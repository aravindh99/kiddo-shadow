import api from "../../../api/axios";
import { API_BASE_URL, VOICE_SERVICE_URL } from "../../../api/config";

export function askAi(question, classLevel) {
  return api.post("/rag/ask", {
    question,
    classLevel,
  });
}

export async function askAiVoice(question, classLevel) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const controller = new AbortController();
  const timeoutMs = 60000;
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException("Voice request timed out", "TimeoutError"));
  }, timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/voice/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question,
        message: question,
        classLevel,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Voice API failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) {
      const data = await response.json();
      const result =
        data?.result && typeof data.result === "object"
          ? data.result
          : {};
      return {
        data,
        result,
        answer: result?.answer || "",
        contentType,
        subtitle: "",
        textOnly: data?.textOnly === true,
      };
    }

    const subtitleHeader = response.headers.get("x-subtitle-text");
    let subtitle = "";
    if (subtitleHeader) {
      try {
        subtitle = decodeURIComponent(subtitleHeader);
      } catch {
        subtitle = subtitleHeader;
      }
    }

    const audioBlob = await response.blob();
    return {
      data: audioBlob,
      contentType,
      subtitle,
      textOnly: false,
    };
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      throw new Error(`Voice request timed out after ${Math.floor(timeoutMs / 1000)} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function speakText(text) {
  return api.post(
    "/rag/speak",
    { text },
    { responseType: "arraybuffer" }
  );
}

export async function speakTextDirect(text) {
  if (!VOICE_SERVICE_URL) {
    throw new Error("VOICE_SERVICE_URL is not configured");
  }

  const res = await fetch(`${VOICE_SERVICE_URL}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Voice service request failed (${res.status})`);
  }

  return res.arrayBuffer();
}
