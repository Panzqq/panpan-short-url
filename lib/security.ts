import { createHash, timingSafeEqual } from "crypto";

function getSecret() {
  return (
    process.env.LINK_PASSWORD_SECRET ||
    process.env.SHORTENER_ADMIN_TOKEN ||
    "panpan-dev-secret-change-this"
  );
}

export function hashPassword(password: string) {
  return createHash("sha256")
    .update(`${getSecret()}:password:${password}`)
    .digest("hex");
}

export function comparePassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;

  const incoming = Buffer.from(hashPassword(password), "hex");
  const stored = Buffer.from(storedHash, "hex");

  if (incoming.length !== stored.length) return false;
  return timingSafeEqual(incoming, stored);
}

export function hashIp(ip: string | null | undefined) {
  if (!ip) return null;

  return createHash("sha256")
    .update(`${getSecret()}:ip:${ip}`)
    .digest("hex")
    .slice(0, 40);
}
