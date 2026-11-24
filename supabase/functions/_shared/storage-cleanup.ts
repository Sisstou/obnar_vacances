/**
 * Pure safety checks for the Storage cleanup report-only phase.
 * This module contains no Supabase client and no destructive operations.
 */

export const CLEANUP_BUCKET = "property-images" as const;
export const GRACE_PERIOD_DAYS = 30;
export const MAX_REPORTED_CANDIDATES = 20;
export const MAX_DIRECTORIES_SCANNED = 500;
export const MAX_STORAGE_LIST_REQUESTS = 2_000;

export type StorageScanBudget = {
  directoriesScanned: number;
  listRequests: number;
};

export function recordDirectoryScan(budget: StorageScanBudget): void {
  budget.directoriesScanned += 1;
  if (budget.directoriesScanned > MAX_DIRECTORIES_SCANNED) {
    throw new Error("DIRECTORY_LIMIT_REACHED");
  }
}

export function recordStorageListRequest(budget: StorageScanBudget): void {
  budget.listRequests += 1;
  if (budget.listRequests > MAX_STORAGE_LIST_REQUESTS) {
    throw new Error("LIST_REQUEST_LIMIT_REACHED");
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidFolder(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isSafeStorageFileName(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 255 &&
    value !== "." &&
    value !== ".." &&
    !/[\\/\u0000-\u001f\u007f]/.test(value);
}

export function isSupportedFolderEntry(entry: {
  name: unknown;
  id?: unknown;
}): boolean {
  return entry.id == null && isUuidFolder(entry.name);
}

export function isSupportedFileEntry(entry: {
  name: unknown;
  id?: unknown;
}): boolean {
  return entry.id != null && isSafeStorageFileName(entry.name);
}

export function isSupportedPropertyImageKey(key: unknown): key is string {
  if (typeof key !== "string" || key.length > 1024) return false;
  const parts = key.split("/");
  return parts.length === 3 &&
    isUuidFolder(parts[0]) &&
    isUuidFolder(parts[1]) &&
    isSafeStorageFileName(parts[2]);
}

export function isOlderThanGracePeriod(
  createdAt: unknown,
  nowMs: number,
  gracePeriodDays = GRACE_PERIOD_DAYS,
): boolean {
  if (typeof createdAt !== "string" || !Number.isFinite(nowMs)) return false;
  const createdAtMs = Date.parse(createdAt);
  if (!Number.isFinite(createdAtMs)) return false;
  if (!Number.isFinite(gracePeriodDays) || gracePeriodDays < 1) return false;
  return createdAtMs <= nowMs - gracePeriodDays * 24 * 60 * 60 * 1000;
}

export function isDryRunCandidate(input: {
  bucketId: unknown;
  key: unknown;
  createdAt: unknown;
  nowMs: number;
  referencedPaths: ReadonlySet<string>;
}): boolean {
  return input.bucketId === CLEANUP_BUCKET &&
    isSupportedPropertyImageKey(input.key) &&
    isOlderThanGracePeriod(input.createdAt, input.nowMs) &&
    !input.referencedPaths.has(input.key);
}
