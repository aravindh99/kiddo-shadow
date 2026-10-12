import { useRef, useState } from "react";

export function useAudioPlayback() {
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  async function play(audioData) {
    if (!audioData) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    const blob =
      audioData instanceof Blob
        ? audioData
        : new Blob([audioData], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setPlaying(true);
    audio.onended = () => {
      setPlaying(false);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
    audio.onerror = () => {
      setPlaying(false);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };

    await audio.play();
  }

  return {
    play,
    playing,
  };
}
