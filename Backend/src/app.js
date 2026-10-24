import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";

import { config } from "./config/config.js";
import { isDatabaseConnected } from "./config/database.js";
import { apiNotFound, errorHandler } from "./middleware/errorHandler.js";

import guestRouter from "./routes/guest.routes.js";
import rideRouter from "./routes/ride.routes.js";

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  const database = isDatabaseConnected();

  res.status(database ? 200 : 503).json({
    status: database ? "ok" : "degraded",
    database: database ? "connected" : "disconnected",
    environment: config.NODE_ENV,
  });
});

app.use("/api/guest-sessions", guestRouter);
app.use("/api/rides", rideRouter);
app.use("/api", apiNotFound);

const distDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../Frontend/dist",
);

app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api")) return next();

  res.sendFile(path.join(distDir, "index.html"));
});

app.use(errorHandler);

export default app;
