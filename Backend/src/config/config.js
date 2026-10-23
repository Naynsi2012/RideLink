import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "production";

export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV,
  isDevelopment: NODE_ENV === "development",
  isProduction: NODE_ENV === "production",
};
