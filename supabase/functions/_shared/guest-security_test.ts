import {
  equalGuestSecretHashes,
  hashGuestAccessSecret,
  isValidGuestAccessSecret,
} from "./guest-security.ts";

const TEST_SECRET = "A".repeat(43);

Deno.test("valid 256-bit base64url secret format is accepted", () => {
  if (!isValidGuestAccessSecret(TEST_SECRET)) {
    throw new Error("Valid test secret format was rejected");
  }
  if (TEST_SECRET.length !== 43) {
    throw new Error("Test secret has an unexpected length");
  }
});

Deno.test("secret hashes are deterministic and compare correctly", async () => {
  const secret = TEST_SECRET;
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


Deno.test("hash output is a lowercase 64-character SHA-256 hex digest", async () => {
  const digest = await hashGuestAccessSecret(TEST_SECRET);
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
  const first = TEST_SECRET;
  const second = "B".repeat(43);
  const [firstHash, secondHash] = await Promise.all([
    hashGuestAccessSecret(first),
    hashGuestAccessSecret(second),
  ]);

  if (firstHash === secondHash) {
    throw new Error("Distinct secrets unexpectedly produced the same digest");
  }
});
