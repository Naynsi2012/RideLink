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
export const STOP_STATUSES = ["planned", "reached", "skipped"];
export const MAX_MEMBERS = 20;
export const MAX_STOPS = 25;

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

const pointSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);

const stopSchema = new mongoose.Schema(
  {
    stopId: { type: String, required: true },
    name: { type: String, required: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    notes: { type: String, default: "" },
    order: { type: Number, required: true },
    status: { type: String, enum: STOP_STATUSES, default: "planned" },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
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
        validator: (members) =>
          members.filter((member) => member.status !== "left").length <=
          MAX_MEMBERS,
        message: `A ride can have at most ${MAX_MEMBERS} members`,
      },
    },
    startPoint: { type: pointSchema },
    destination: { type: pointSchema },
    stops: {
      type: [stopSchema],
      validate: {
        validator: (stops) => stops.length <= MAX_STOPS,
        message: `A ride can have at most ${MAX_STOPS} stops`,
      },
    },
    itineraryVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

rideSchema.index({ "members.memberId": 1 });
export default mongoose.model("Ride", rideSchema);
