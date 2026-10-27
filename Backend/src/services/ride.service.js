import crypto from "node:crypto";
import Ride, { MAX_MEMBERS, MAX_STOPS } from "../models/ride.model.js";
import { ApiError } from "../middleware/errorHandler.js";
import {
  generateInviteCode,
  hashInviteCode,
  isValidInviteCodeFormat,
} from "../utils/inviteCode.js";
import {
  insertAt,
  moveTo,
  removeStop,
  sortedStops,
} from "../utils/stopOrder.js";

const MAX_CODE_ATTEMPTS = 5;
const MAX_EDIT_ATTEMPTS = 5;
const JOINABLE_STATUSES = ["scheduled", "active", "paused"];
const EDITABLE_STATUSES = ["scheduled", "active", "paused"];
const OBJECT_ID_FORMAT = /^[0-9a-fA-F]{24}$/;

const HAS_ROOM = {
  $expr: {
    $lt: [
      {
        $size: {
          $filter: {
            input: "$members",
            cond: { $ne: ["$$this.status", "left"] },
          },
        },
      },
      MAX_MEMBERS,
    ],
  },
};

function toPointDto(point) {
  if (!point) return null;
  return {
    label: point.label,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

function toStopDto(stop) {
  return {
    stopId: stop.stopId,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
    notes: stop.notes,
    order: stop.order,
    status: stop.status,
    createdBy: stop.createdBy,
    createdAt: stop.createdAt,
    updatedAt: stop.updatedAt,
  };
}

export function toStopDtos(ride) {
  return sortedStops(ride.stops ?? []).map(toStopDto);
}

export function toRideDto(ride) {
  return {
    id: ride._id.toString(),
    name: ride.name,
    status: ride.status,
    leaderId: ride.leaderId,
    startPoint: toPointDto(ride.startPoint),
    destination: toPointDto(ride.destination),
    stops: toStopDtos(ride),
    members: ride.members
      .filter((member) => member.status !== "left")
      .map((member) => ({
        memberId: member.memberId,
        displayName: member.displayName,
        role: member.role,
        joinedAt: member.joinedAt,
        locationSharingEnabled: member.locationSharingEnabled,
        status: member.status,
      })),
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  };
}

export async function createRideForLeader({ memberId, name, displayName }) {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const inviteCode = generateInviteCode();

    try {
      const ride = await Ride.create({
        name,
        inviteCodeHash: hashInviteCode(inviteCode),
        leaderId: memberId,
        members: [{ memberId, displayName, role: "leader" }],
      });
      return { ride, inviteCode };
    } catch (error) {
      if (error.code === 11000) continue;
      throw error;
    }
  }

  throw new ApiError(500, "Could not generate a unique invite code");
}

export async function getRideForMember(rideId, memberId) {
  if (!OBJECT_ID_FORMAT.test(rideId)) {
    throw new ApiError(404, "Ride not found");
  }

  const ride = await Ride.findOne({
    _id: rideId,
    members: { $elemMatch: { memberId, status: { $ne: "left" } } },
  });

  if (!ride) throw new ApiError(404, "Ride not found");
  return ride;
}

export async function joinRideByInviteCode({
  inviteCode,
  memberId,
  displayName,
}) {
  if (!isValidInviteCodeFormat(inviteCode)) {
    throw new ApiError(404, "Invite code not found");
  }

  const inviteCodeHash = hashInviteCode(inviteCode);

  const addedRide = await Ride.findOneAndUpdate(
    {
      inviteCodeHash,
      status: { $in: JOINABLE_STATUSES },
      "members.memberId": { $ne: memberId },
      ...HAS_ROOM,
    },
    {
      $push: {
        members: {
          memberId,
          displayName,
          role: "rider",
          joinedAt: new Date(),
          locationSharingEnabled: false,
          status: "active",
        },
      },
    },
    { returnDocument: "after" },
  );
  if (addedRide) return { ride: addedRide, joined: true };

  const rejoinedRide = await Ride.findOneAndUpdate(
    {
      inviteCodeHash,
      status: { $in: JOINABLE_STATUSES },
      members: { $elemMatch: { memberId, status: "left" } },
      ...HAS_ROOM,
    },
    {
      $set: {
        "members.$[m].status": "active",
        "members.$[m].displayName": displayName,
        "members.$[m].joinedAt": new Date(),
        "members.$[m].locationSharingEnabled": false,
      },
    },
    { returnDocument: "after", arrayFilters: [{ "m.memberId": memberId }] },
  );
  if (rejoinedRide) return { ride: rejoinedRide, joined: true };

  const ride = await Ride.findOne({ inviteCodeHash });
  if (!ride) throw new ApiError(404, "Invite code not found");

  const existing = ride.members.find((m) => m.memberId === memberId);
  if (existing && existing.status !== "left") {
    return { ride, joined: false };
  }

  if (!JOINABLE_STATUSES.includes(ride.status)) {
    throw new ApiError(409, "This ride is no longer open to new members");
  }
  throw new ApiError(409, "This ride is full");
}

export async function leaveRideAsMember(rideId, memberId) {
  const ride = await getRideForMember(rideId, memberId);

  if (ride.leaderId === memberId) {
    throw new ApiError(
      409,
      "The leader cannot leave the ride. Complete or cancel it instead",
    );
  }

  const updated = await Ride.findOneAndUpdate(
    {
      _id: ride._id,
      members: { $elemMatch: { memberId, status: { $ne: "left" } } },
    },
    {
      $set: {
        "members.$[m].status": "left",
        "members.$[m].locationSharingEnabled": false,
      },
    },
    { returnDocument: "after", arrayFilters: [{ "m.memberId": memberId }] },
  );

  if (!updated) throw new ApiError(404, "Ride not found");

  return ride._id.toString();
}

function versionFilter(version) {
  return version === 0 ? { $in: [0, null] } : version;
}

async function applyItineraryChange(rideId, memberId, build) {
  for (let attempt = 0; attempt < MAX_EDIT_ATTEMPTS; attempt++) {
    const ride = await getRideForMember(rideId, memberId);

    if (ride.leaderId !== memberId) {
      throw new ApiError(403, "Only the leader can change the itinerary");
    }
    if (!EDITABLE_STATUSES.includes(ride.status)) {
      throw new ApiError(409, "This ride can no longer be edited");
    }

    const { set = {}, unset = {}, result } = build(ride.toObject());

    const update = { $inc: { itineraryVersion: 1 } };
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;

    const updated = await Ride.findOneAndUpdate(
      {
        _id: ride._id,
        itineraryVersion: versionFilter(ride.itineraryVersion ?? 0),
      },
      update,
      { returnDocument: "after" },
    );

    if (updated) return { ride: updated, result };
  }

  throw new ApiError(
    409,
    "The itinerary was changed at the same moment. Please try again",
  );
}

export function updateRideDetails(rideId, memberId, changes) {
  return applyItineraryChange(rideId, memberId, () => {
    const set = {};
    const unset = {};

    if (changes.name !== undefined) set.name = changes.name;
    for (const key of ["startPoint", "destination"]) {
      if (changes[key] === undefined) continue;
      if (changes[key] === null) unset[key] = "";
      else set[key] = changes[key];
    }

    return { set, unset };
  });
}

export function addStop(rideId, memberId, input) {
  return applyItineraryChange(rideId, memberId, (ride) => {
    if (ride.stops.length >= MAX_STOPS) {
      throw new ApiError(409, `A ride can have at most ${MAX_STOPS} stops`);
    }

    const now = new Date();
    const stopId = crypto.randomUUID();
    const stop = {
      stopId,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      notes: input.notes,
      order: 0,
      status: "planned",
      createdBy: memberId,
      createdAt: now,
      updatedAt: now,
    };

    return {
      set: { stops: insertAt(ride.stops, stop, input.order) },
      result: stopId,
    };
  });
}

export function updateStop(rideId, memberId, stopId, changes) {
  return applyItineraryChange(rideId, memberId, (ride) => {
    if (!ride.stops.some((stop) => stop.stopId === stopId)) {
      throw new ApiError(404, "Stop not found");
    }

    const { order, ...fields } = changes;
    let stops = ride.stops.map((stop) =>
      stop.stopId === stopId
        ? { ...stop, ...fields, updatedAt: new Date() }
        : stop,
    );
    if (order !== undefined) stops = moveTo(stops, stopId, order);

    return { set: { stops: sortedStops(stops) }, result: stopId };
  });
}

export function deleteStop(rideId, memberId, stopId) {
  return applyItineraryChange(rideId, memberId, (ride) => {
    if (!ride.stops.some((stop) => stop.stopId === stopId)) {
      throw new ApiError(404, "Stop not found");
    }

    return { set: { stops: removeStop(ride.stops, stopId) }, result: stopId };
  });
}
