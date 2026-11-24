import type { AppError } from './result';

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

const RETRYABLE_CODES = new Set([
  'fetch_error',
  'network_error',
  'timeout',
  'authretryablefetcherror',
]);

function isRetryable(value: unknown, code: string): boolean {
  if (RETRYABLE_CODES.has(code.toLowerCase())) return true;

  const candidate =
    typeof value === 'object' && value !== null
      ? (value as ErrorLike)
      : undefined;

  const status = candidate?.status;
  if (typeof status === 'number') {
    return status === 408 || status === 425 || status === 429 || status >= 500;
  }

  const message =
    typeof candidate?.message === 'string'
      ? candidate.message
      : value instanceof Error
        ? value.message
        : '';

  return /network request failed|failed to fetch|fetch failed|timed? ?out|timeout|network error/i.test(
    message,
  );
}

export function toAppError(
  value: unknown,
  fallbackMessage = 'حدث خطأ غير متوقع. حاول مرة أخرى.',
): AppError {
  const candidate =
    typeof value === 'object' && value !== null
      ? (value as ErrorLike)
      : undefined;

  const code =
    typeof candidate?.code === 'string'
      ? candidate.code
      : typeof candidate?.status === 'number'
        ? String(candidate.status)
        : value instanceof Error && value.name
          ? value.name
          : 'unknown_error';

  const message =
    typeof candidate?.message === 'string' && candidate.message.trim()
      ? candidate.message
      : value instanceof Error && value.message
        ? value.message
        : fallbackMessage;

  return {
    code,
    message,
    retryable: isRetryable(value, code),
  };
}
