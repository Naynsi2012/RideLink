import {
  valdiateCreateRide,
  validateJoinRide,
} from "../validators/ride.validator.js";
import {
  createRideForLeader,
  getRideForMember,
  joinRideByInviteCode,
  leaveRideAsMember,
  toRideDto,
} from "../services/ride.service.js";
import {
  announceMemberJoined,
  announceMemberLeft,
} from "../sockets/broadcast.js";

export async function createRide(req, res) {
  const input = valdiateCreateRide(req.body);

  const { ride, inviteCode } = await createRideForLeader({
    memberId: req.guest.memberId,
    ...input,
  });

  res.status(201).json({ ride: toRideDto(ride), inviteCode });
}

export async function joinRide(req, res) {
  const { displayName } = validateJoinRide(req.body);

  const { ride, joined } = await joinRideByInviteCode({
    inviteCode: req.params.inviteCode,
    memberId: req.guest.memberId,
    displayName,
  });

  if (joined) {
    announceMemberJoined(req.app.get("io"), ride, req.guest.memberId);
  }

  res.status(joined ? 201 : 200).json({ ride: toRideDto(ride) });
}

export async function getRideDetails(req, res) {
  const ride = await getRideForMember(req.params.rideId, req.guest.memberId);
  res.status(200).json({ ride: toRideDto(ride) });
}

export async function leaveRide(req, res) {
  const rideId = await leaveRideAsMember(req.params.rideId, req.guest.memberId);

  announceMemberLeft(req.app.get("io"), rideId, req.guest.memberId);
  res.status(204).end();
}
