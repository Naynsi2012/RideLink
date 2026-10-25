import Ride from "../models/ride.model.js";
import { ApiError } from "../middleware/errorHandler.js";
import { generateInviteCode, hashInviteCode } from "../utils/inviteCode.js";

const MAX_CODE_ATTEMPTS = 5;

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