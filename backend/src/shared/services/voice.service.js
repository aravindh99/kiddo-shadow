const TTS_BASE_URL = process.env.TTS_SERVICE_URL;

if (!TTS_BASE_URL) {
  throw new Error("TTS_SERVICE_URL is not defined");
}

const normalizedBase = TTS_BASE_URL.replace(/\/+$/, "");
const TTS_ENDPOINT = normalizedBase.endsWith("/tts")
  ? normalizedBase
  : `${normalizedBase}/tts`;

export function chunkText(text) {
  return text
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean);
}

export async function textToSpeech(text) {
  const res = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`TTS failed with status ${res.status}`);
  }

  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}
