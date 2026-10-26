import { authenticateSocket } from "./auth.js";
import { registerRideHandlers } from "./ride.handlers.js";

export function registerSockets(io) {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    registerRideHandlers(socket);
  });
}
