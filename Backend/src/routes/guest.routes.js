import express from "express";
import {
  createGuestSession,
  getCurrentGuest,
} from "../controllers/guest.controller.js";
import { authenticateGuest } from "../middleware/authenticateGuest.js";

const guestRouter = express.Router();

guestRouter.post("/", createGuestSession);
guestRouter.get("/me", authenticateGuest, getCurrentGuest);

export default guestRouter;
