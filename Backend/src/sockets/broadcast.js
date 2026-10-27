import { toRideDto } from "../services/ride.service.js";
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
