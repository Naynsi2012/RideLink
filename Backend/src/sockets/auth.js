import {
  GUEST_COOKIE_NAME,
  findActiveSession,
} from "../services/guest.service.js";
import { readCookie } from "../utils/cookies.js";

export async function authenticateSocket(socket, next) {
  try {
    const credential = readCookie(
      socket.handshake.headers.cookie,
      GUEST_COOKIE_NAME,
    );

    const session = await findActiveSession(credential);
    if (!session) return next(new Error("unauthorized"));

    socket.data.memberId = session.memberId;
    next();
  } catch (err) {
    console.error(err);
    next(new Error("server error"));
  }
}
