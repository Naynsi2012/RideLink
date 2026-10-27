import express from "express";
import { authenticateGuest } from "../middleware/authenticateGuest.js";
import {
  getRideDetails,
  createRide,
  joinRide,
  leaveRide,
  updateRide,
  removeStop,
  editStop,
  createStop,
} from "../controllers/ride.controller.js";

const rideRouter = express.Router();

rideRouter.use(authenticateGuest);

rideRouter.post("/", createRide);
rideRouter.post("/:inviteCode/join", joinRide);
rideRouter.post("/:rideId/leave", leaveRide);
rideRouter.get("/:rideId", getRideDetails);
rideRouter.patch("/:rideId", updateRide);

rideRouter.post("/:rideId/stops", createStop);
rideRouter.patch("/:rideId/stops/:stopId", editStop);
rideRouter.delete("/:rideId/stops/:stopId", removeStop);

export default rideRouter;
