import { ApiError } from "../middleware/errorHandler.js";
import { getRideForMember, toRideDto } from "../services/ride.service.js";

export function rideRoom(rideId) {
  return `ride:${rideId}`;
}

function withAck(handler) {
  return async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};

    try {
      reply({ ok: true, ...(await handler(payload)) });
    } catch (err) {
      if (err instanceof ApiError) {
        reply({
          ok: false,
          error: { code: err.statusCode, message: err.message },
        });
      } else {
        console.error(err);
        reply({
          ok: false,
          error: { code: 500, message: "Internal server error" },
        });
      }
    }
  };
}

export function registerRideHandlers(socket) {
  socket.on(
    "ride:join",
    withAck(async (payload) => {
      const rideId = payload?.rideId;
      if (typeof rideId !== "string") {
        throw new ApiError(400, "rideId is required");
      }

      const ride = await getRideForMember(rideId, socket.data.memberId);

      await socket.join(rideRoom(ride._id.toString()));
      socket.emit("ride:state", { ride: toRideDto(ride) });

      return {};
    }),
  );
}
