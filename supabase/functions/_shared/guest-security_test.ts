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


Deno.test("generated secrets use only the base64url alphabet", () => {
  for (let i = 0; i < 100; i += 1) {
    const secret = createGuestAccessSecret();
    if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) {
      throw new Error("Generated secret contains a non-base64url character");
    }
  }
});

Deno.test("hash output is a lowercase 64-character SHA-256 hex digest", async () => {
  const digest = await hashGuestAccessSecret(createGuestAccessSecret());
  if (!/^[a-f0-9]{64}$/.test(digest)) {
    throw new Error("Secret hash has an invalid SHA-256 hex representation");
  }
});

Deno.test("hash comparison rejects malformed values without throwing", () => {
  const malformedPairs: Array<[string, string]> = [
    ["", "0".repeat(64)],
    ["g".repeat(64), "0".repeat(64)],
    ["0".repeat(63), "0".repeat(64)],
    ["0".repeat(64), "0".repeat(65)],
  ];

  for (const [left, right] of malformedPairs) {
    if (equalGuestSecretHashes(left, right)) {
      throw new Error("Malformed hash input unexpectedly compared equal");
    }
  }
});

Deno.test("distinct generated secrets produce distinct hashes", async () => {
  const first = createGuestAccessSecret();
  const second = createGuestAccessSecret();
  const [firstHash, secondHash] = await Promise.all([
    hashGuestAccessSecret(first),
    hashGuestAccessSecret(second),
  ]);

  if (firstHash === secondHash) {
    throw new Error("Distinct secrets unexpectedly produced the same digest");
  }
});
