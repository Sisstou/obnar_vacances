import { withSupabase } from "npm:@supabase/server@1.9.2";
import {
  CLEANUP_BUCKET,
  GRACE_PERIOD_DAYS,
  MAX_REPORTED_CANDIDATES,
  recordDirectoryScan,
  recordStorageListRequest,
  type StorageScanBudget,
  isDryRunCandidate,
  isSupportedFileEntry,
  isSupportedFolderEntry,
} from "../_shared/storage-cleanup.ts";

const PAGE_SIZE = 100;
const MAX_STORAGE_OBJECTS_SCANNED = 5_000;
const MAX_DIRECTORY_ENTRIES = 1_000;
const MAX_REFERENCE_ROWS = 50_000;
const DAY_MS = 24 * 60 * 60 * 1000;

type StorageEntry = {
  name: string;
  id?: string | null;
  created_at?: string | null;
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status });
}

async function listAllPages(
  listPage: (offset: number, limit: number) => Promise<{
    data: StorageEntry[] | null;
    error: { message: string } | null;
  }>,
  maxEntries: number,
  budget: StorageScanBudget,
): Promise<StorageEntry[]> {
  const entries: StorageEntry[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    recordStorageListRequest(budget);
    const { data, error } = await listPage(offset, PAGE_SIZE);
    if (error) throw new Error("STORAGE_LIST_FAILED");
    const page = data ?? [];
    entries.push(...page);
    if (entries.length > maxEntries) throw new Error("SCAN_LIMIT_REACHED");
    if (page.length < PAGE_SIZE) return entries;
  }
}

async function loadReferencedPaths(supabase: any): Promise<Set<string>> {
  const references = new Set<string>();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("property_images")
      .select("storage_path")
      .not("storage_path", "is", null)
      .order("storage_path", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error("REFERENCE_QUERY_FAILED");
    const rows = data ?? [];
    for (const row of rows) {
      if (typeof row.storage_path !== "string") {
        throw new Error("INVALID_REFERENCE_ROW");
      }
      references.add(row.storage_path);
    }

    if (references.size > MAX_REFERENCE_ROWS) {
      throw new Error("REFERENCE_LIMIT_REACHED");
    }
    if (rows.length < PAGE_SIZE) return references;
    if (offset + PAGE_SIZE >= MAX_REFERENCE_ROWS) {
      throw new Error("REFERENCE_SCAN_INCOMPLETE");
    }
  }
}

async function listDirectory(
  supabase: any,
  path: string,
  budget: StorageScanBudget,
): Promise<StorageEntry[]> {
  recordDirectoryScan(budget);
  return await listAllPages(
    (offset, limit) => supabase.storage.from(CLEANUP_BUCKET).list(path, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    }),
    MAX_DIRECTORY_ENTRIES,
    budget,
  );
}

async function discoverPropertyImageObjects(supabase: any): Promise<{
  objects: StorageEntry[];
  budget: StorageScanBudget;
  unsupportedEntryCount: number;
}> {
  const budget: StorageScanBudget = { directoriesScanned: 0, listRequests: 0 };
  let unsupportedEntryCount = 0;
  const rootEntries = await listDirectory(supabase, "", budget);
  const owners: StorageEntry[] = [];

  for (const entry of rootEntries) {
    if (isSupportedFolderEntry(entry)) owners.push(entry);
    else unsupportedEntryCount += 1;
  }

  const objects: StorageEntry[] = [];
  for (const owner of owners) {
    const ownerEntries = await listDirectory(supabase, owner.name, budget);
    const properties: StorageEntry[] = [];

    for (const entry of ownerEntries) {
      if (isSupportedFolderEntry(entry)) properties.push(entry);
      else unsupportedEntryCount += 1;
    }

    for (const property of properties) {
      const propertyPath = `${owner.name}/${property.name}`;
      const fileEntries = await listDirectory(supabase, propertyPath, budget);

      for (const entry of fileEntries) {
        if (!isSupportedFileEntry(entry)) {
          unsupportedEntryCount += 1;
          continue;
        }
        objects.push({ ...entry, name: `${propertyPath}/${entry.name}` });
        if (objects.length > MAX_STORAGE_OBJECTS_SCANNED) {
          throw new Error("SCAN_LIMIT_REACHED");
        }
      }
    }
  }

  return { objects, budget, unsupportedEntryCount };
}

function safeErrorCode(error: unknown): string {
  if (error instanceof Error && /^[A-Z_]{3,64}$/.test(error.message)) {
    return error.message;
  }
  return "INTERNAL_ERROR";
}

Deno.serve(
  withSupabase({ auth: "secret:storage_cleanup" }, async (request, context) => {
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "METHOD_NOT_ALLOWED" });
    }

    const invocationSecret = Deno.env.get("STORAGE_CLEANUP_INVOKE_SECRET");
    const suppliedSecret = request.headers.get("x-cleanup-secret") ?? "";
    if (!invocationSecret || suppliedSecret.length !== invocationSecret.length) {
      return jsonResponse(401, { error: "UNAUTHORIZED" });
    }

    let mismatch = 0;
    for (let index = 0; index < invocationSecret.length; index += 1) {
      mismatch |= invocationSecret.charCodeAt(index) ^ suppliedSecret.charCodeAt(index);
    }
    if (mismatch !== 0) return jsonResponse(401, { error: "UNAUTHORIZED" });

    const runId = crypto.randomUUID();
    const startedAt = Date.now();

    try {
      const [referencedPaths, discovery] = await Promise.all([
        loadReferencedPaths(context.supabaseAdmin),
        discoverPropertyImageObjects(context.supabaseAdmin),
      ]);
      const { objects: storageObjects, budget, unsupportedEntryCount } = discovery;

      const nowMs = Date.now();
      const candidates: Array<{
        bucket_id: typeof CLEANUP_BUCKET;
        name: string;
        created_at: string;
        age_days: number;
      }> = [];
      let eligibleCount = 0;
      let skippedRecentOrReferenced = 0;
      let skippedMissingTimestamp = 0;

      for (const object of storageObjects) {
        if (!object.created_at) {
          skippedMissingTimestamp += 1;
          continue;
        }

        const eligible = isDryRunCandidate({
          bucketId: CLEANUP_BUCKET,
          key: object.name,
          createdAt: object.created_at,
          nowMs,
          referencedPaths,
        });

        if (!eligible) {
          if (!Number.isFinite(Date.parse(object.created_at))) {
            skippedMissingTimestamp += 1;
          } else {
            skippedRecentOrReferenced += 1;
          }
          continue;
        }

        eligibleCount += 1;
        if (candidates.length < MAX_REPORTED_CANDIDATES) {
          candidates.push({
            bucket_id: CLEANUP_BUCKET,
            name: object.name,
            created_at: object.created_at,
            age_days: Math.floor((nowMs - Date.parse(object.created_at)) / DAY_MS),
          });
        }
      }

      const report = {
        mode: "dry-run",
        deletion_enabled: false,
        run_id: runId,
        bucket_scanned: CLEANUP_BUCKET,
        grace_period_days: GRACE_PERIOD_DAYS,
        max_candidates_returned: MAX_REPORTED_CANDIDATES,
        scanned_objects: storageObjects.length,
        scanned_directories: budget.directoriesScanned,
        storage_list_requests: budget.listRequests,
        reference_count: referencedPaths.size,
        eligible_candidate_count: eligibleCount,
        candidates_truncated: eligibleCount > candidates.length,
        candidates,
        skipped_recent_or_referenced: skippedRecentOrReferenced,
        skipped_unsupported_path: unsupportedEntryCount,
        skipped_missing_or_invalid_timestamp: skippedMissingTimestamp,
        duration_ms: Date.now() - startedAt,
      };

      console.info(JSON.stringify({
        event: "storage_cleanup_dry_run_completed",
        run_id: runId,
        bucket: CLEANUP_BUCKET,
        scanned_objects: report.scanned_objects,
        scanned_directories: report.scanned_directories,
        storage_list_requests: report.storage_list_requests,
        reference_count: report.reference_count,
        eligible_candidate_count: report.eligible_candidate_count,
        skipped_unsupported_path: report.skipped_unsupported_path,
        duration_ms: report.duration_ms,
      }));

      return jsonResponse(200, report);
    } catch (error) {
      const errorCode = safeErrorCode(error);
      console.error(JSON.stringify({
        event: "storage_cleanup_dry_run_failed",
        run_id: runId,
        error_code: errorCode,
        duration_ms: Date.now() - startedAt,
      }));
      return jsonResponse(503, {
        mode: "dry-run",
        deletion_enabled: false,
        run_id: runId,
        error: errorCode,
        message: "The scan did not complete; no cleanup action was performed.",
      });
    }
  }),
);
