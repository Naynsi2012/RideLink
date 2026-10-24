import {
  GUEST_COOKIE_NAME,
  findActiveSession,
  issueGuestSession,
} from "../services/guest.service.js";

export async function createGuestSession(req, res) {
  const existing = await findActiveSession(req.cookies?.[GUEST_COOKIE_NAME]);
  if (existing) {
    return res.status(200).json({
      memberId: existing.memberId,
      expiresAt: existing.expiresAt,
    });
  }

  const { credential, memberId, expiresAt } = await issueGuestSession();

  res.cookie(GUEST_COOKIE_NAME, credential, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    expires: expiresAt,
  });

  res.status(201).json({ memberId, expiresAt });
}

export async function getCurrentGuest(req, res) {
  res.status(200).json({ memberId: req.guest.memberId });
}
