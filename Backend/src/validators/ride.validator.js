import { ApiError } from "../middleware/errorHandler.js";

export const DISALLOWED_CHARS = /\p{C}/u;

export function readText(value, field, max, errors) {
  if (typeof value !== "string") {
    errors[field] = `${field} is required`;
    return undefined;
  }

  const text = value.trim().replace(/\s+/g, " ");
  const length = [...text].length;

  if (length < 1) {
    errors[field] = `${field} is required`;
  } else if (length > max) {
    errors[field] = `${field} must be at most ${max} characters`;
  } else if (DISALLOWED_CHARS.test(text)) {
    errors[field] = `${field} contains unsupported characters`;
  } else {
    return text;
  }

  return undefined;
}

export function validateCreateRide(body) {
  const input = body ?? {};
  const errors = {};

  const name = readText(input.name, "name", 60, errors);
  const displayName = readText(input.displayName, "displayName", 30, errors);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "Invalid ride data", errors);
  }

  return { name, displayName };
}

export function validateJoinRide(body) {
  const input = body ?? {};
  const errors = {};

  const displayName = readText(input.displayName, "displayName", 30, errors);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "Invalid join data", errors);
  }

  return { displayName };
}