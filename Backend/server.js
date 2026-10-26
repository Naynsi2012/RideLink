import http from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import { config } from "./src/config/config.js";
import { connectDatabase } from "./src/config/database.js";
import { registerSockets } from "./src/sockets/index.js";
import { isSameOriginRequest } from "./src/utils/origin.js";

async function start() {
  await connectDatabase();

  const server = http.createServer(app);
  const io = new Server(server, {
    maxHttpBufferSize: 16 * 1024,
    allowRequest: (req, callback) => callback(null, isSameOriginRequest(req)),
  });

  registerSockets(io);

  server.listen(config.PORT, () => {
    console.log(`Server listening on PORT ${config.PORT}`);
  });
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
