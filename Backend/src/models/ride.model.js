import mongoose from "mongoose";

export const RIDE_STATUSES = [
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
];
export const MEMBER_ROLES = ["leader", "rider"];
export const MEMBER_STATUS = ["active", "disconnected", "left"];
export const MAX_MEMBERS = 20;

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: MEMBER_ROLES,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    locationSharingEnabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: MEMBER_STATUS,
      default: "active",
    },
  },
  { _id: false },
);

const rideSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    inviteCodeHash: {
      type: String,
      required: true,
      unique: true,
    },
    leaderId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: RIDE_STATUSES,
      default: "scheduled",
    },
    members: {
      type: [memberSchema],
      validate: {
        validator: (members) => members.length <= MAX_MEMBERS,
        message: `A ride can have at most ${MAX_MEMBERS} members`,
      },
    },
  },
  { timestamps: true },
);

rideSchema.index({ "members.memberId": 1 });
export default mongoose.model("Ride", rideSchema);
