import express from "express";
const rideRouter = express.Router();

import { getRideDetails, createRide, joinRide } from "../controllers/ride.controller.js";

rideRouter.get("/:rideId", getRideDetails)

rideRouter.post("/", createRide);
rideRouter.post("/:rideId/join", joinRide);

export default rideRouter;
