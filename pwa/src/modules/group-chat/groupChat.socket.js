import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../../api/config";

let socket;

export function connectGroupChatSocket(token) {
  if (socket) return socket;

  socket = io(SOCKET_BASE_URL, {
    auth: { token },
  });

  return socket;
}

export function disconnectGroupChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getGroupChatSocket() {
  return socket;
}
