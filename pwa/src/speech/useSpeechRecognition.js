export function useSpeechRecognition(onResult) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => {},
      stop: () => {},
      supported: false,
    };
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-IN";

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    onResult(text);
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    supported: true,
  };
}
