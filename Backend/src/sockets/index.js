import { authenticateSocket } from "./auth.js";
import { registerRideHandlers } from "./ride.handlers.js";
import { memberRoom } from "./rooms.js";

export function registerSockets(io) {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.join(memberRoom(socket.data.memberId));
    registerRideHandlers(io, socket);
  });
}
