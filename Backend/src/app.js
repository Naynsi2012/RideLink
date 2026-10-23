import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

import { config } from "./config/config.js";

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is healthy" });
});

if (config.isDevelopment) {
  app.get("/", (req, res) => {
    res.status(200).json({
      status: "ok",
      environment: config.NODE_ENV,
      message: `Server is running on ${config.NODE_ENV} at PORT ${config.PORT}`,
    });
  });
}

if (config.isProduction) {
  const distDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../Frontend/dist",
  );

  app.use(express.static(distDir));
  app.use((req, res) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api")) return next();

    res.sendFile(path.join(distDir, "index.html"));
  });
}

export default app;