import { useEffect, useState } from "react";
import { connectQuizSocket } from "../socket/quiz.socket";
import { useAuth } from "../../../auth/AuthProvider";

export function useQuizPlay(sessionId) {
  const { token } = useAuth();
  const [answered, setAnswered] = useState({});

  useEffect(() => {
    const socket = connectQuizSocket(token);

    const handleAnswerAck = ({ questionId }) => {
      setAnswered((prev) => ({ ...prev, [questionId]: true }));
    };

    socket.on("quiz:answer_ack", handleAnswerAck);

    return () => {
      socket.off("quiz:answer_ack", handleAnswerAck);
    };
  }, [token, sessionId]);

  function submitAnswer(questionId, selectedIndex) {
    const socket = connectQuizSocket(token);

    socket.emit("quiz:answer", {
      sessionId,
      questionId,
      selectedIndex,
    });
  }

  return {
    submitAnswer,
    answered,
  };
}
