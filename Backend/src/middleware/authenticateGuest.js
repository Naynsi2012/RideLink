import { ApiError } from "./errorHandler.js";
import {
  GUEST_COOKIE_NAME,
  findActiveSession,
} from "../services/guest.service.js";

export async function authenticateGuest(req, res, next) {
  const session = await findActiveSession(req.cookies?.[GUEST_COOKIE_NAME]);

  if (!session) throw new ApiError(401, "Guest session required");

  req.guest = { memberId: session.memberId };
  next();
}
