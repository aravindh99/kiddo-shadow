import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../../../api/config";

let socket;
export function connectQuizSocket(token) {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      auth: { token },
    });
  }
  return socket;
}

export function disconnectQuizSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getQuizSocket() {
  return socket;
}
