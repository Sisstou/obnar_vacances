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
  '429',
  '500',
  '502',
  '503',
  '504',
]);

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
    retryable: RETRYABLE_CODES.has(code.toLowerCase()),
  };
}
