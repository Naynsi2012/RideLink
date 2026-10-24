import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 1000,
    });

    console.log(`MongoDB connected (${mongoose.connection.host})`);
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
