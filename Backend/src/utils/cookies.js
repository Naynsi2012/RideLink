export function readCookie(header, name) {
  if (typeof header !== "string") return undefined;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;

    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch (err) {
      return undefined;
    }
  }

  return undefined;
}
