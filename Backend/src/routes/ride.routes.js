import express from "express";
import { authenticateGuest } from "../middleware/authenticateGuest.js";
import {
  getRideDetails,
  createRide,
  joinRide,
} from "../controllers/ride.controller.js";

const rideRouter = express.Router();

rideRouter.use(authenticateGuest);

rideRouter.get("/:rideId", getRideDetails);

rideRouter.post("/", createRide);
rideRouter.post("/:rideId/join", joinRide);

export default rideRouter;
