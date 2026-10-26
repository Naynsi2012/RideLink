import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const CODE_FORMAT = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

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

export function isValidInviteCodeFormat(input) {
  return CODE_FORMAT.test(normalizeInviteCode(input));
}

export function hashInviteCode(code) {
  return crypto
    .createHash("sha256")
    .update(normalizeInviteCode(code))
    .digest("hex");
}
