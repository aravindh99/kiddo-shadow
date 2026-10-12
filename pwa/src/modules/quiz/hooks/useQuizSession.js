import { useEffect, useState } from "react";
import { connectQuizSocket } from "../socket/quiz.socket";
import { useAuth } from "../../../auth/AuthProvider";

export function useQuizSession(sessionRef) {
    const { token, user } = useAuth();
    const [status, setStatus] = useState("WAITING");
    const [player, setPlayer] = useState(null);
    const [isHost, setIsHost] = useState(Boolean(sessionRef?.host));
    const [time, setTime] = useState(null);
    const [lobby, setLobby] = useState({ players: [], hostName: "Host" });
    const resolvedSessionId = typeof sessionRef === "object" ? sessionRef?.sessionId : sessionRef;
    const roomCode = typeof sessionRef === "object" ? sessionRef?.roomCode : undefined;

    useEffect(() => {
        const socket = connectQuizSocket(token);
        const handleJoined = (data) => {
            setPlayer(data);
            setIsHost(Boolean(data.isHost));
            if (data?.status === "IN_PROGRESS") {
                setStatus("IN_PROGRESS");
            } else if (data?.status === "FINISHED") {
                setStatus("FINISHED");
            } else {
                setStatus("WAITING");
            }
        };
        const handleLobbyUpdate = (data) => {
            setLobby({
                players: Array.isArray(data?.players) ? data.players : [],
                hostName: data?.hostName || "Host",
            });
            if (data?.hostUserId && user?.id) {
                setIsHost(String(data.hostUserId) === String(user.id));
            }
            if (data?.status === "IN_PROGRESS") {
                setStatus("IN_PROGRESS");
            } else if (data?.status === "FINISHED") {
                setStatus("FINISHED");
            }
        };
        const handleStarted = (data) => {
            setStatus("IN_PROGRESS");
            setTime(data.totalTimeMs);
        };
        const handleTimeUp = () => {
            setStatus("FINISHED");
        };
        const handleAllFinished = () => {
            setStatus("FINISHED");
        };
        const handleError = (data) => {
            const message = data?.message || "Quiz session error";
            alert(message);
        };

        socket.emit("quiz:join", { sessionId: resolvedSessionId, roomCode });

        socket.on("quiz:joined", handleJoined);
        socket.on("quiz:lobby_update", handleLobbyUpdate);
        socket.on("quiz:started", handleStarted);
        socket.on("quiz:time_up", handleTimeUp);
        socket.on("quiz:all_finished", handleAllFinished);
        socket.on("quiz:error", handleError);

        return () => {
            socket.off("quiz:joined", handleJoined);
            socket.off("quiz:lobby_update", handleLobbyUpdate);
            socket.off("quiz:started", handleStarted);
            socket.off("quiz:time_up", handleTimeUp);
            socket.off("quiz:all_finished", handleAllFinished);
            socket.off("quiz:error", handleError);
        };
    }, [resolvedSessionId, roomCode, token, user?.id]);

    function startQuiz() {
        const socket = connectQuizSocket(token);
        socket.emit("quiz:start", { sessionId: resolvedSessionId });
    }

    function finishQuiz() {
        const socket = connectQuizSocket(token);
        socket.emit("quiz:finished", { sessionId: resolvedSessionId });
    }

    return {
        status,
        player,
        lobby,
        time,
        isHost,
        startQuiz,
        finishQuiz,
    };
}
