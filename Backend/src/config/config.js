import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "production";

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV,
  isDevelopment: NODE_ENV === "development",
  isProduction: NODE_ENV === "production",
  MONGO_URI: process.env.MONGO_URI,
};
