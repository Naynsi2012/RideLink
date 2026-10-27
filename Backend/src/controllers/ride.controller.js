import {
  validateCreateRide,
  validateJoinRide,
} from "../validators/ride.validator.js";
import {
  validateCreateStop,
  validateUpdateRide,
  validateUpdateStop,
} from "../validators/itinerary.validator.js";
import {
  addStop,
  createRideForLeader,
  deleteStop,
  getRideForMember,
  joinRideByInviteCode,
  leaveRideAsMember,
  toRideDto,
  toStopDtos,
  updateRideDetails,
  updateStop,
} from "../services/ride.service.js";
import {
  announceMemberJoined,
  announceMemberLeft,
  announceRideUpdated,
  announceStopCreated,
  announceStopDeleted,
  announceStopUpdated,
} from "../sockets/broadcast.js";

export async function createRide(req, res) {
  const input = validateCreateRide(req.body);

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

export async function updateRide(req, res) {
  const changes = validateUpdateRide(req.body);

  const { ride } = await updateRideDetails(
    req.params.rideId,
    req.guest.memberId,
    changes,
  );

  announceRideUpdated(req.app.get("io"), ride);
  res.status(200).json({ ride: toRideDto(ride) });
}

export async function createStop(req, res) {
  const input = validateCreateStop(req.body);

  const { ride, result: stopId } = await addStop(
    req.params.rideId,
    req.guest.memberId,
    input,
  );

  announceStopCreated(req.app.get("io"), ride, stopId);

  const stops = toStopDtos(ride);
  res.status(201).json({
    stop: stops.find((stop) => stop.stopId === stopId),
    stops,
  });
}

export async function editStop(req, res) {
  const changes = validateUpdateStop(req.body);

  const { ride, result: stopId } = await updateStop(
    req.params.rideId,
    req.guest.memberId,
    req.params.stopId,
    changes,
  );

  announceStopUpdated(req.app.get("io"), ride, stopId);

  const stops = toStopDtos(ride);
  res.status(200).json({
    stop: stops.find((stop) => stop.stopId === stopId),
    stops,
  });
}

export async function removeStop(req, res) {
  const { ride, result: stopId } = await deleteStop(
    req.params.rideId,
    req.guest.memberId,
    req.params.stopId,
  );

  announceStopDeleted(req.app.get("io"), ride, stopId);
  res.status(200).json({ stops: toStopDtos(ride) });
}
