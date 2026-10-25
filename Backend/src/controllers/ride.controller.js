import { valdiateCreateRide } from "../validators/ride.validator.js";
import { createRideForLeader, toRideDto } from "../services/ride.service.js";

export async function createRide(req, res) {
  const input = valdiateCreateRide(req.body);

  const { ride, inviteCode } = await createRideForLeader({
    memberId: req.guest.memberId,
    ...input,
  });

  res.status(201).json({ ride: toRideDto(ride), inviteCode });
}

export async function joinRide(req, res) {}

export async function getRideDetails(req, res) {}
