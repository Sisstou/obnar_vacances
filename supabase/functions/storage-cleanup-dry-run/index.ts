import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import {
  CLEANUP_BUCKET,
  GRACE_PERIOD_DAYS,
  MAX_REPORTED_CANDIDATES,
  isDryRunCandidate,
  isSafeStorageFileName,
  isUuidFolder,
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
  metadata?: Record<string, unknown> | null;
};

type Candidate = {
  bucket_id: typeof CLEANUP_BUCKET;
  name: string;
  created_at: string;
  age_days: number;
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function listAllPages(
  listPage: (offset: number, limit: number) => Promise<{
    data: StorageEntry[] | null;
    error: { message: string } | null;
  }>,
  maxEntries: number,
): Promise<StorageEntry[]> {
  const entries: StorageEntry[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await listPage(offset, PAGE_SIZE);
    if (error) throw new Error("STORAGE_LIST_FAILED");
    const page = data ?? [];
    entries.push(...page);
    if (entries.length > maxEntries) throw new Error("SCAN_LIMIT_REACHED");
    if (page.length < PAGE_SIZE) return entries;
  }
}

async function loadReferencedPaths(
  supabase: ReturnType<typeof createClient>,
): Promise<Set<string>> {
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
  supabase: ReturnType<typeof createClient>,
  path: string,
): Promise<StorageEntry[]> {
  return await listAllPages(
    (offset, limit) => supabase.storage.from(CLEANUP_BUCKET).list(path, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    }),
    MAX_DIRECTORY_ENTRIES,
  );
}

async function discoverPropertyImageObjects(
  supabase: ReturnType<typeof createClient>,
): Promise<StorageEntry[]> {
  const rootEntries = await listDirectory(supabase, "");
  const owners = rootEntries.filter((entry) => entry.id == null && isUuidFolder(entry.name));
  const objects: StorageEntry[] = [];

  for (const owner of owners) {
    const ownerEntries = await listDirectory(supabase, owner.name);
    const properties = ownerEntries.filter(
      (entry) => entry.id == null && isUuidFolder(entry.name),
    );

    for (const property of properties) {
      const propertyPath = `${owner.name}/${property.name}`;
      const fileEntries = await listDirectory(supabase, propertyPath);

      for (const entry of fileEntries) {
        if (entry.id == null || !isSafeStorageFileName(entry.name)) continue;
        objects.push({
          ...entry,
          name: `${propertyPath}/${entry.name}`,
        });
        if (objects.length > MAX_STORAGE_OBJECTS_SCANNED) {
          throw new Error("SCAN_LIMIT_REACHED");
        }
      }
    }
  }

  return objects;
}

function safeErrorCode(error: unknown): string {
  if (error instanceof Error && /^[A-Z_]{3,64}$/.test(error.message)) {
    return error.message;
  }
  return "INTERNAL_ERROR";
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "METHOD_NOT_ALLOWED" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const invocationSecret = Deno.env.get("STORAGE_CLEANUP_INVOKE_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !invocationSecret) {
    console.error(JSON.stringify({ event: "storage_cleanup_config_error" }));
    return jsonResponse(503, { error: "SERVICE_NOT_CONFIGURED" });
  }

  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = request.headers.get("x-cleanup-secret") ?? "";
  if (
    !constantTimeEqual(authorization, `Bearer ${serviceRoleKey}`) ||
    !constantTimeEqual(suppliedSecret, invocationSecret)
  ) {
    return jsonResponse(401, { error: "UNAUTHORIZED" });
  }

  const runId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const [referencedPaths, storageObjects] = await Promise.all([
      loadReferencedPaths(supabase),
      discoverPropertyImageObjects(supabase),
    ]);

    const nowMs = Date.now();
    const candidates: Candidate[] = [];
    let eligibleCount = 0;
    let skippedRecentOrReferenced = 0;
    let skippedUnsupported = 0;
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
        if (
          typeof object.created_at === "string" &&
          !Number.isFinite(Date.parse(object.created_at))
        ) {
          skippedMissingTimestamp += 1;
        } else if (!object.name.split("/").every((part, index) =>
          index === 2 ? isSafeStorageFileName(part) : isUuidFolder(part)
        )) {
          skippedUnsupported += 1;
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
      reference_count: referencedPaths.size,
      eligible_candidate_count: eligibleCount,
      candidates_truncated: eligibleCount > candidates.length,
      candidates,
      skipped_recent_or_referenced: skippedRecentOrReferenced,
      skipped_unsupported_path: skippedUnsupported,
      skipped_missing_or_invalid_timestamp: skippedMissingTimestamp,
      duration_ms: Date.now() - startedAt,
    };

    // Object keys are returned only to the authenticated caller, never written to logs.
    console.info(JSON.stringify({
      event: "storage_cleanup_dry_run_completed",
      run_id: runId,
      bucket: CLEANUP_BUCKET,
      scanned_objects: report.scanned_objects,
      reference_count: report.reference_count,
      eligible_candidate_count: report.eligible_candidate_count,
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
});
