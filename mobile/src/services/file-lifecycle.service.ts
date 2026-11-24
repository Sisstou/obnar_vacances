import { err, type AppResult } from '../lib/result';
import {
  buildVersionedStoragePath,
  type VersionedPathInput,
} from './file-lifecycle';
import {
  uploadStorageObject,
  type StorageUploadInput,
  type StoredObject,
} from './storage.service';

export type VersionedUploadInput = Omit<
  StorageUploadInput,
  'path'
> &
  Omit<VersionedPathInput, 'fileName' | 'version'> & {
    fileName: string;
    version?: number;
  };

/**
 * Generates a new versioned path and uploads without overwriting an older file.
 * The caller remains responsible for updating the corresponding database
 * reference through an approved server-side workflow.
 */
export async function uploadVersionedStorageObject(
  input: VersionedUploadInput,
): Promise<AppResult<StoredObject>> {
  const pathResult = buildVersionedStoragePath({
    bucket: input.bucket,
    primaryId: input.primaryId,
    secondaryId: input.secondaryId,
    fileName: input.fileName,
    version: input.version,
  });

  if (!pathResult.ok) return err(pathResult.error);

  return uploadStorageObject({
    bucket: input.bucket,
    path: pathResult.data,
    body: input.body,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    cacheControlSeconds: input.cacheControlSeconds,
  });
}
