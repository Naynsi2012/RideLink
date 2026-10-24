export function registerSockets(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected");

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });
}
