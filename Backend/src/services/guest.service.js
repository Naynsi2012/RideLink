import crypto from "node:crypto";
import GuestSession from "../models/GuestSession.model.js";

export const GUEST_COOKIE_NAME = "ridelink_guest";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashCredential(credential) {
  return crypto.createHash("sha256").update(credential).digest("hex");
}

export async function issueGuestSession() {
  const credential = crypto.randomBytes(32).toString("base64url");

  const session = await GuestSession.create({
    memberId: crypto.randomUUID(),
    credentialHash: hashCredential(credential),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return {
    credential,
    memberId: session.memberId,
    expiresAt: session.expiresAt,
  };
}

export async function findActiveSession(credential) {
  if (typeof credential !== "string" || credential.length === 0) return null;
  if (credential.length > 100) return null;

  return GuestSession.findOne({
    credentialHash: hashCredential(credential),
    expiresAt: { $gt: new Date() },
  }).lean();
}
