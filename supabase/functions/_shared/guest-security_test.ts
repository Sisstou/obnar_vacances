import {
  createGuestAccessSecret,
  equalGuestSecretHashes,
  hashGuestAccessSecret,
  isValidGuestAccessSecret,
} from "./guest-security.ts";

Deno.test("guest access secret is 256-bit base64url material", () => {
  const secret = createGuestAccessSecret();
  if (!isValidGuestAccessSecret(secret)) {
    throw new Error("Generated secret has an invalid format");
  }
  if (secret.length !== 43) {
    throw new Error("Generated secret has an unexpected length");
  }
});

Deno.test("guest access secrets are not repeated", () => {
  const first = createGuestAccessSecret();
  const second = createGuestAccessSecret();
  if (first === second) throw new Error("Two generated secrets unexpectedly matched");
});

Deno.test("secret hashes are deterministic and compare correctly", async () => {
  const secret = createGuestAccessSecret();
  const first = await hashGuestAccessSecret(secret);
  const second = await hashGuestAccessSecret(secret);
  if (first !== second) throw new Error("Hash must be deterministic");
  if (!equalGuestSecretHashes(first, second)) {
    throw new Error("Matching hashes did not compare equal");
  }
  if (equalGuestSecretHashes(first, "0".repeat(64))) {
    throw new Error("Different hashes compared equal");
  }
});

Deno.test("malformed secrets are rejected", async () => {
  if (isValidGuestAccessSecret("short")) {
    throw new Error("Malformed secret was accepted");
  }
  let rejected = false;
  try {
    await hashGuestAccessSecret("short");
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Malformed secret was hashed");
});
