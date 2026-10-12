import { useRef, useState } from "react";

export function useSpeechRecognition({ onResult }) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  function start() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return {
    start,
    stop,
    listening,
  };
}
