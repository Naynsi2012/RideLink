import { ApiError } from "../middleware/errorHandler.js";
import { getRideForMember, toRideDto } from "../services/ride.service.js";
import { syncPresence } from "./presence.js";
import { rideRoom } from "./rooms.js";

function withAck(handler) {
  return async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};

    try {
      reply({ ok: true, ...(await handler(payload)) });
    } catch (error) {
      if (error instanceof ApiError) {
        reply({
          ok: false,
          error: { code: error.statusCode, message: error.message },
        });
      } else {
        console.error(error);
        reply({
          ok: false,
          error: { code: 500, message: "Internal server error" },
        });
      }
    }
  };
}

export function registerRideHandlers(io, socket) {
  socket.on(
    "ride:join",
    withAck(async (payload) => {
      const rideId = payload?.rideId;
      if (typeof rideId !== "string") {
        throw new ApiError(400, "rideId is required");
      }

      const ride = await getRideForMember(rideId, socket.data.memberId);
      const id = ride._id.toString();

      await socket.join(rideRoom(id));

      const refreshed = await syncPresence(io, id, socket.data.memberId);

      socket.emit("ride:state", { ride: toRideDto(refreshed ?? ride) });
      return {};
    }),
  );

  socket.on("disconnecting", () => {
    try {
      for (const room of socket.rooms) {
        if (!room.startsWith("ride:")) continue;

        const rideId = room.slice("ride:".length);
        syncPresence(io, rideId, socket.data.memberId, socket.id).catch((err) =>
          console.error(err),
        );
      }
    } catch (err) {
      console.error(err);
    }
  });
}
