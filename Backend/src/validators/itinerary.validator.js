import { ApiError } from "../middleware/errorHandler.js";
import { STOP_STATUSES } from "../models/ride.model.js";
import { DISALLOWED_CHARS, readText } from "./ride.validator.js";

const MAX_LABEL = 60;
const MAX_NOTES = 200;

function readCoordinate(value, field, limit, errors) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors[field] = `${field} must be a number`;
    return undefined;
  }

  if (Math.abs(value) > limit) {
    errors[field] = `${field} must be between -${limit} and ${limit}`;
    return undefined;
  }

  return value;
}

function readNotes(value, errors) {
  if (typeof value !== "string") {
    errors.notes = "notes must be text";
    return undefined;
  }

  const text = value.trim().replace(/\s+/g, " ");
  if ([...text].length > MAX_NOTES) {
    errors.notes = `notes must be at most ${MAX_NOTES} characters`;
    return undefined;
  }

  if (DISALLOWED_CHARS.test(text)) {
    errors.notes = "notes contains unsupported characters";
    return undefined;
  }

  return text;
}

function readOrder(value, errors) {
  if (!Number.isInteger(value) || value < 0) {
    errors.order = "order must be a whole number, 0 or more";
    return undefined;
  }

  return value;
}

function readPoint(value, field, errors) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors[field] = `${field} must be an object or null`;
    return undefined;
  }

  const before = Object.keys(errors).length;
  const label = readText(value.label, `${field}.label`, MAX_LABEL, errors);
  const latitude = readCoordinate(
    value.latitude,
    `${field}.latitude`,
    90,
    errors,
  );
  const longitude = readCoordinate(
    value.longitude,
    `${field}.longitude`,
    180,
    errors,
  );

  if (Object.keys(errors).length > before) return undefined;
  return { label, latitude, longitude };
}

function fail(message, errors) {
  throw new ApiError(400, message, errors);
}

export function validateUpdateRide(body) {
  const input = body ?? {};
  const errors = {};
  const changes = {};

  if (input.name !== undefined) {
    changes.name = readText(input.name, "name", 60, errors);
  }

  for (const key of ["startPoint", "destination"]) {
    if (input[key] === undefined) continue;
    changes[key] =
      input[key] === null ? null : readPoint(input[key], key, errors);
  }

  if (Object.keys(errors).length > 0) fail("Invalid ride data", errors);
  if (Object.keys(changes).length === 0) {
    fail("Nothing to update", { body: "send name, startPoint or destination" });
  }

  return changes;
}

export function validateCreateStop(body) {
  const input = body ?? {};
  const errors = {};

  const name = readText(input.name, "name", MAX_LABEL, errors);
  const latitude = readCoordinate(input.latitude, "latitude", 90, errors);
  const longitude = readCoordinate(input.longitude, "longitude", 180, errors);
  const notes = input.notes === undefined ? "" : readNotes(input.notes, errors);
  const order =
    input.order === undefined ? undefined : readOrder(input.order, errors);

  if (Object.keys(errors).length > 0) fail("Invalid stop data", errors);
  return { name, latitude, longitude, notes, order };
}

export function validateUpdateStop(body) {
  const input = body ?? {};
  const errors = {};
  const changes = {};

  if (input.name !== undefined) {
    changes.name = readText(input.name, "name", MAX_LABEL, errors);
  }
  if (input.latitude !== undefined) {
    changes.latitude = readCoordinate(input.latitude, "latitude", 90, errors);
  }
  if (input.longitude !== undefined) {
    changes.longitude = readCoordinate(
      input.longitude,
      "longitude",
      180,
      errors,
    );
  }
  if (input.notes !== undefined) {
    changes.notes = readNotes(input.notes, errors);
  }
  if (input.status !== undefined) {
    if (STOP_STATUSES.includes(input.status)) {
      changes.status = input.status;
    } else {
      errors.status = `status must be one of: ${STOP_STATUSES.join(", ")}`;
    }
  }
  if (input.order !== undefined) {
    changes.order = readOrder(input.order, errors);
  }

  if (Object.keys(errors).length > 0) fail("Invalid stop data", errors);
  if (Object.keys(changes).length === 0) {
    fail("Nothing to update", { body: "send at least one stop field" });
  }
  return changes;
}
