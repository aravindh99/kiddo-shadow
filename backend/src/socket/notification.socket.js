import jwt from "jsonwebtoken";

export function initNotificationSocket(io) {
  /**
   * SOCKET AUTH (JWT)
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        id: decoded.id,
        role: decoded.role,
        school_id: decoded.school_id,
      };

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    /**
     * JOIN SCHOOL NOTIFICATION ROOM
     * - all users join their school room
     */
    const schoolRoom = `school:${socket.user.school_id}`;
    socket.join(schoolRoom);

    socket.emit("notification:connected", {
      school_id: socket.user.school_id,
    });
  });
}
