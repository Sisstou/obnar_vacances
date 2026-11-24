/**
 * Server-side validation and hashing primitives for OBNAR VACANCES guest booking.
 *
 * The browser generates the guest access secret with Web Crypto. This server
 * module must not mint guest access secrets. It does not persist tokens, log
 * secrets, authorize bookings, or replace database-backed throttling.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Reject malformed or truncated tokens before any database lookup. */
export function isValidGuestAccessSecret(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

/** Hash a valid guest secret for storage; never store the plaintext value. */
export async function hashGuestAccessSecret(secret: string): Promise<string> {
  if (!isValidGuestAccessSecret(secret)) {
    throw new TypeError("Invalid guest access credential");
  }
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return toHex(new Uint8Array(digest));
}

/**
 * Constant-work comparison for fixed-format hexadecimal hashes.
 * Both inputs are checked for format first; callers must not expose which
 * credential component failed.
 */
export function equalGuestSecretHashes(left: string, right: string): boolean {
  const validHex = /^[a-f0-9]{64}$/;
  if (!validHex.test(left) || !validHex.test(right)) return false;

  let difference = 0;
  for (let i = 0; i < 64; i += 1) {
    difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return difference === 0;
}
