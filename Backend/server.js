import app from "./src/app.js";
import { config } from "./src/config/config.js";
import { Server } from "socket.io";
import http from "http";

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (msg) => {
    console.log("Message received:", msg);
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(config.PORT, () => {
  console.log(`Server listening on PORT ${config.PORT}`);
});
