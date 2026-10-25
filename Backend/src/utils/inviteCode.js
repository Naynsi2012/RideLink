import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function generateInviteCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }

  return code;
}

export function normalizeInviteCode(input) {
  return typeof input === "string" ? input.trim().toUpperCase() : "";
}

export function hashInviteCode(code) {
  return crypto
    .createHash("sha256")
    .update(normalizeInviteCode(code))
    .digest("hex");
}
