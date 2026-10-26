import Ride, { MAX_MEMBERS } from "../models/ride.model.js";
import { ApiError } from "../middleware/errorHandler.js";
import {
  generateInviteCode,
  hashInviteCode,
  isValidInviteCodeFormat,
} from "../utils/inviteCode.js";

const MAX_CODE_ATTEMPTS = 5;
const JOINABLE_STATUSES = ["scheduled", "active", "paused"];
const OBJECT_ID_FORMAT = /^[0-9a-fA-F]{24}$/;

export function toRideDto(ride) {
  return {
    id: ride._id.toString(),
    name: ride.name,
    status: ride.status,
    leaderId: ride.leaderId,
    members: ride.members.map((member) => ({
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

  const joinedRide = await Ride.findOneAndUpdate(
    {
      inviteCodeHash,
      status: { $in: JOINABLE_STATUSES },
      "members.memberId": { $ne: memberId },
      [`members.${MAX_MEMBERS - 1}`]: { $exists: false },
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
    { new: true },
  );

  if (joinedRide) return { ride: joinedRide, joined: true };

  const ride = await Ride.findOne({ inviteCodeHash });
  if (!ride) throw new ApiError(404, "Invite code not found");

  const existing = ride.members.find((m) => m.memberId === memberId);
  if (existing) {
    if (existing.status === "left") {
      throw new ApiError(409, "You have left this ride");
    }

    return { ride, joined: false };
  }

  if (!JOINABLE_STATUSES.includes(ride.status)) {
    throw new ApiError(409, "This ride is no longer open to new members");
  }

  throw new ApiError(409, "This ride is full");
}
