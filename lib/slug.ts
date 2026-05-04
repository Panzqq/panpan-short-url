const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const reservedSlugs = new Set([
  "api",
  "admin",
  "dashboard",
  "login",
  "register",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml"
]);

export function generateSlug(length = 6) {
  let slug = "";

  for (let i = 0; i < length; i += 1) {
    slug += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  return slug;
}

export function normalizeSlug(slug: string) {
  return slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

export function isValidSlug(slug: string) {
  return /^[a-z0-9_-]{3,32}$/.test(slug) && !reservedSlugs.has(slug);
}
