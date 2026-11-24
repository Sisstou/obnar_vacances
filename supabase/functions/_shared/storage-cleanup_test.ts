import {
  CLEANUP_BUCKET,
  GRACE_PERIOD_DAYS,
  isDryRunCandidate,
  isOlderThanGracePeriod,
  isSafeStorageFileName,
  isSupportedFileEntry,
  isSupportedFolderEntry,
  isSupportedPropertyImageKey,
  isUuidFolder,
  MAX_DIRECTORIES_SCANNED,
  MAX_STORAGE_LIST_REQUESTS,
  recordDirectoryScan,
  recordStorageListRequest,
} from "./storage-cleanup.ts";

const OWNER_ID = "123e4567-e89b-12d3-a456-426614174000";
const PROPERTY_ID = "123e4567-e89b-12d3-a456-426614174001";
const KEY = `${OWNER_ID}/${PROPERTY_ID}/photo.webp`;
const NOW = Date.parse("2026-11-24T12:00:00.000Z");
const OLD_DATE = "2026-10-01T12:00:00.000Z";
const RECENT_DATE = "2026-11-20T12:00:00.000Z";

Deno.test("accepts UUID folder names and rejects malformed identifiers", () => {
  if (!isUuidFolder(OWNER_ID)) throw new Error("Valid UUID rejected");
  if (isUuidFolder("../owner")) throw new Error("Path traversal accepted");
});

Deno.test("accepts only the exact owner/property/file path layout", () => {
  if (!isSupportedPropertyImageKey(KEY)) throw new Error("Valid key rejected");
  if (isSupportedPropertyImageKey(`${OWNER_ID}/${PROPERTY_ID}/nested/photo.webp`)) {
    throw new Error("Nested path accepted");
  }
  if (isSupportedPropertyImageKey(`other/${PROPERTY_ID}/photo.webp`)) {
    throw new Error("Non-UUID owner folder accepted");
  }
});

Deno.test("rejects unsafe file names", () => {
  if (!isSafeStorageFileName("photo.webp")) throw new Error("Safe name rejected");
  for (const name of ["", ".", "..", "../photo.webp", "a/b", "a\\b", "bad\u0000name"]) {
    if (isSafeStorageFileName(name)) throw new Error(`Unsafe name accepted: ${name}`);
  }
});

Deno.test("classifies unsupported folders and file entries for accurate reporting", () => {
  if (!isSupportedFolderEntry({ name: OWNER_ID, id: null })) {
    throw new Error("Valid owner folder was not recognized");
  }
  if (isSupportedFolderEntry({ name: "legacy-folder", id: null })) {
    throw new Error("Unsupported folder was classified as supported");
  }
  if (!isSupportedFileEntry({ name: "photo.webp", id: "object-id" })) {
    throw new Error("Valid file entry was not recognized");
  }
  if (isSupportedFileEntry({ name: "../photo.webp", id: "object-id" })) {
    throw new Error("Unsafe file entry was classified as supported");
  }
  if (isSupportedFileEntry({ name: "nested", id: null })) {
    throw new Error("Directory entry was classified as a file");
  }
});

Deno.test("uses the 30-day grace period and fails closed on invalid timestamps", () => {
  if (GRACE_PERIOD_DAYS !== 30) throw new Error("Grace period changed unexpectedly");
  if (!isOlderThanGracePeriod(OLD_DATE, NOW)) throw new Error("Old object not eligible");
  if (isOlderThanGracePeriod(RECENT_DATE, NOW)) throw new Error("Recent object eligible");
  if (isOlderThanGracePeriod("not-a-date", NOW)) throw new Error("Invalid date eligible");
  if (isOlderThanGracePeriod(null, NOW)) throw new Error("Missing date eligible");
});

Deno.test("only old, unreferenced property-images keys become dry-run candidates", () => {
  const emptyRefs = new Set<string>();
  const base = {
    bucketId: CLEANUP_BUCKET,
    key: KEY,
    createdAt: OLD_DATE,
    nowMs: NOW,
    referencedPaths: emptyRefs,
  };
  if (!isDryRunCandidate(base)) throw new Error("Expected candidate was rejected");
  if (isDryRunCandidate({ ...base, referencedPaths: new Set([KEY]) })) {
    throw new Error("Referenced object became a candidate");
  }
  if (isDryRunCandidate({ ...base, bucketId: "owner-documents" })) {
    throw new Error("Unsupported bucket became a candidate");
  }
  if (isDryRunCandidate({ ...base, createdAt: RECENT_DATE })) {
    throw new Error("Recent object became a candidate");
  }
  if (isDryRunCandidate({ ...base, key: `${OWNER_ID}/${PROPERTY_ID}/nested/photo.webp` })) {
    throw new Error("Unsupported path became a candidate");
  }
});

Deno.test("enforces a hard total directory scan limit", () => {
  const budget = { directoriesScanned: 0, listRequests: 0 };
  for (let index = 0; index < MAX_DIRECTORIES_SCANNED; index += 1) {
    recordDirectoryScan(budget);
  }
  if (budget.directoriesScanned !== MAX_DIRECTORIES_SCANNED) {
    throw new Error("Directory budget did not reach its configured limit");
  }
  let rejected = false;
  try {
    recordDirectoryScan(budget);
  } catch (error) {
    rejected = error instanceof Error && error.message === "DIRECTORY_LIMIT_REACHED";
  }
  if (!rejected) throw new Error("Directory scan limit was not enforced");
});

Deno.test("enforces a hard total Storage list request limit", () => {
  const budget = { directoriesScanned: 0, listRequests: 0 };
  for (let index = 0; index < MAX_STORAGE_LIST_REQUESTS; index += 1) {
    recordStorageListRequest(budget);
  }
  if (budget.listRequests !== MAX_STORAGE_LIST_REQUESTS) {
    throw new Error("Request budget did not reach its configured limit");
  }
  let rejected = false;
  try {
    recordStorageListRequest(budget);
  } catch (error) {
    rejected = error instanceof Error && error.message === "LIST_REQUEST_LIMIT_REACHED";
  }
  if (!rejected) throw new Error("Storage list request limit was not enforced");
});
