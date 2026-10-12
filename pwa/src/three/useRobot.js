import { useEffect, useState } from "react";

export function useRobot({ speaking }) {
  const [blink, setBlink] = useState(false);

  // 👁️ blink loop (placeholder)
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 4000);

    return () => clearInterval(id);
  }, []);

  return {
    blink,
    speaking,
  };
}
