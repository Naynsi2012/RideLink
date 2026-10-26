export function isSameOriginRequest(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    return new URL(origin).host === req.headers.host;
  } catch (err) {
    return false;
  }
}
