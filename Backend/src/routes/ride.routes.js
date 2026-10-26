import express from "express";
import { authenticateGuest } from "../middleware/authenticateGuest.js";
import {
  getRideDetails,
  createRide,
  joinRide,
} from "../controllers/ride.controller.js";

const rideRouter = express.Router();

rideRouter.use(authenticateGuest);

rideRouter.post("/", createRide);
rideRouter.post("/:inviteCode/join", joinRide);
rideRouter.get("/:rideId", getRideDetails);

export default rideRouter;
