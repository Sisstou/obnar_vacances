import type { AppResult } from '../lib/result';

export type StorageBucket =
  | 'property-images'
  | 'business-images'
  | 'owner-documents'
  | 'payment-receipts'
  | 'refund-proofs';

export interface StorageBucketPolicy {
  maxBytes: number;
  allowedContentTypes: readonly string[];
  folderDepth: number;
}

export interface UploadValidationInput {
  bucket: StorageBucket;
  path: string;
  contentType: string;
  sizeBytes: number;
}

export interface VersionedPathInput {
  bucket: StorageBucket;
  primaryId: string;
  secondaryId?: string;
  fileName: string;
  /** Must be selected by the caller from an authoritative version record. */
  version: number;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'] as const;

const BUCKET_POLICIES: Record<StorageBucket, StorageBucketPolicy> = {
  'property-images': {
    maxBytes: 5 * 1024 * 1024,
    allowedContentTypes: IMAGE_TYPES,
    folderDepth: 2,
  },
  'business-images': {
    maxBytes: 5 * 1024 * 1024,
    allowedContentTypes: IMAGE_TYPES,
    folderDepth: 2,
  },
  'owner-documents': {
    maxBytes: 5 * 1024 * 1024,
    allowedContentTypes: DOCUMENT_TYPES,
    folderDepth: 1,
  },
  'payment-receipts': {
    maxBytes: 5 * 1024 * 1024,
    allowedContentTypes: DOCUMENT_TYPES,
    folderDepth: 2,
  },
  'refund-proofs': {
    maxBytes: 5 * 1024 * 1024,
    allowedContentTypes: DOCUMENT_TYPES,
    folderDepth: 1,
  },
};

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const SAFE_BASENAME = /^[A-Za-z0-9_-]{1,80}$/;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

function success<T>(data: T): AppResult<T> {
  return { ok: true, data };
}

function failure<T = never>(message: string): AppResult<T> {
  return {
    ok: false,
    error: {
      code: 'invalid_storage_upload',
      message,
      retryable: false,
    },
  };
}

export function getStorageBucketPolicy(
  bucket: StorageBucket,
): StorageBucketPolicy | null {
  return BUCKET_POLICIES[bucket] ?? null;
}

/** Validates client-side constraints; Storage RLS and bucket limits remain authoritative. */
export function validateStorageUpload(
  input: UploadValidationInput,
): AppResult<true> {
  const policy = getStorageBucketPolicy(input.bucket);
  if (!policy) return failure('حاوية الملفات غير مدعومة.');

  if (
    !Number.isSafeInteger(input.sizeBytes) ||
    input.sizeBytes <= 0 ||
    input.sizeBytes > policy.maxBytes
  ) {
    return failure('حجم الملف غير صالح أو يتجاوز الحد المسموح.');
  }

  if (!policy.allowedContentTypes.some((allowedType) => allowedType === input.contentType)) {
    return failure('نوع الملف غير مسموح لهذه الحاوية.');
  }

  const segments = input.path.split('/');
  if (
    input.path.startsWith('/') ||
    segments.length !== policy.folderDepth + 1 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        !/^[A-Za-z0-9_.-]{1,128}$/.test(segment),
    )
  ) {
    return failure('مسار الملف لا يطابق بنية الحاوية المطلوبة.');
  }

  const extension = input.path.split('.').pop()?.toLowerCase();
  if (extension !== EXTENSIONS[input.contentType]) {
    return failure('امتداد الملف لا يتوافق مع نوع المحتوى.');
  }

  return success(true);
}

/**
 * Builds a non-overwriting object path. The caller must supply the next version
 * from an authoritative workflow; this helper never guesses or increments it.
 *
 * primaryId / secondaryId mapping:
 * - property-images: ownerId / propertyId
 * - business-images: ownerId / businessId
 * - owner-documents: ownerId
 * - payment-receipts: travelerId / bookingId
 * - refund-proofs: cancellationId
 */
export function buildVersionedStoragePath(
  input: VersionedPathInput,
): AppResult<string> {
  const policy = getStorageBucketPolicy(input.bucket);
  if (!policy) return failure('حاوية الملفات غير مدعومة.');

  const primaryId = input.primaryId.trim();
  const secondaryId = input.secondaryId?.trim();
  if (!SAFE_ID.test(primaryId)) return failure('معرّف المجلد الأول غير صالح.');

  const needsSecondary = policy.folderDepth === 2;
  if (needsSecondary && (!secondaryId || !SAFE_ID.test(secondaryId))) {
    return failure('معرّف المجلد الثاني مطلوب وغير صالح.');
  }
  if (!needsSecondary && secondaryId) {
    return failure('هذه الحاوية لا تقبل مجلداً ثانياً.');
  }

  const rawName = input.fileName.trim();
  const dot = rawName.lastIndexOf('.');
  const baseName = dot > 0 ? rawName.slice(0, dot) : rawName;
  const extension = dot > 0 ? rawName.slice(dot + 1).toLowerCase() : '';
  if (
    !SAFE_BASENAME.test(baseName) ||
    !Object.values(EXTENSIONS).includes(extension)
  ) {
    return failure('اسم الملف أو امتداده غير صالح.');
  }

  if (!Number.isSafeInteger(input.version) || input.version < 1 || input.version > 9999) {
    return failure('رقم نسخة الملف غير صالح.');
  }

  const folders = needsSecondary
    ? [primaryId, secondaryId as string]
    : [primaryId];
  return success(`${folders.join('/')}/${baseName}_v${input.version}.${extension}`);
}
