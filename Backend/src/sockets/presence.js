import Ride from "../models/ride.model.js";
import { runExclusive } from "../utils/keyedQueue.js";
import { rideRoom } from "./rooms.js";

export function syncPresence(io, rideId, memberId, ignoreSocketId) {
  return runExclusive(`${rideId}:${memberId}`, async () => {
    const sockets = await io.in(rideRoom(rideId)).fetchSockets();
    const connected = sockets.some(
      (socket) =>
        socket.data.memberId === memberId && socket.id !== ignoreSocketId,
    );

    const from = connected ? "disconnected" : "active";
    const to = connected ? "active" : "disconnected";

    const updated = await Ride.findOneAndUpdate(
      { _id: rideId, members: { $elemMatch: { memberId, status: from } } },
      { $set: { "members.$[m].status": to } },
      { returnDocument: "after", arrayFilters: [{ "m.memberId": memberId }] },
    );

    if (updated) {
      io.to(rideRoom(rideId)).emit("member:presence", { memberId, status: to });
    }
    return updated;
  });
}
