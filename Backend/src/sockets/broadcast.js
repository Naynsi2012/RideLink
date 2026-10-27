import { toRideDto, toStopDtos } from "../services/ride.service.js";
import { memberRoom, rideRoom } from "./rooms.js";

export function announceMemberJoined(io, ride, memberId) {
  const member = toRideDto(ride).members.find((m) => m.memberId === memberId);
  if (!member) return;

  io.to(rideRoom(ride._id.toString())).emit("member:joined", { member });
}

export function announceMemberLeft(io, rideId, memberId) {
  const room = rideRoom(rideId);

  io.to(room).emit("member:left", { memberId });
  io.in(memberRoom(memberId)).socketsLeave(room);
}

export function announceRideUpdated(io, ride) {
  io.to(rideRoom(ride._id.toString())).emit("ride:updated", {
    ride: toRideDto(ride),
  });
}

export function announceStopCreated(io, ride, stopId) {
  const stops = toStopDtos(ride);

  io.to(rideRoom(ride._id.toString())).emit("stop:created", {
    stop: stops.find((s) => s.stopId === stopId),
    stops,
  });
}

export function announceStopUpdated(io, ride, stopId) {
  const stops = toStopDtos(ride);
  io.to(rideRoom(ride._id.toString())).emit("stop:updated", {
    stop: stops.find((s) => s.stopId === stopId),
    stops,
  });
}

export function announceStopDeleted(io, ride, stopId) {
  io.to(rideRoom(ride._id.toString())).emit("stop:deleted", {
    stopId,
    stops: toStopDtos(ride),
  });
}
