import { config } from "../config/config.js";

export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function apiNotFound(req, res) {
  res.status(404).json({ message: "API endpoint not found" });
}

export async function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    message: statusCode >= 500 ? "Internal server error" : err.message,
    ...(err.details ? { details: err.details } : {}),
    ...(config.isDevelopment && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
